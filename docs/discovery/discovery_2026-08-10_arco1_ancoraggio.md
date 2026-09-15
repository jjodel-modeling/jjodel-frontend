# Discovery — Passo 0 dell'arco 1 del rail destro: ancoraggio

**Documento prompt**: `2026-08-10 21:30`
**Data di esecuzione**: 2026-08-10
**Tipo**: discovery read-only. Nessuna modifica sotto `frontend/src/`.
**HEAD al momento dell'esecuzione**: `10dc25879` (branch `alfonso-frontend-jjtl`)
**Ratifiche a monte**: R-RAIL-1..R-RAIL-13 + corollari (Alfonso, 2026-08-10). Non rimesse
in discussione qui.

---

## 0. Obiettivo

Riverificare, a HEAD, le sei classi di ancore che il passo 0 del prompt elenca, prima di
qualunque diff. Il prompt avverte esplicitamente che Slice C è atterrata dopo la
rilevazione di Fase 0 e può aver spostato i numeri di riga.

**Guard di deriva — tutte e tre le condizioni valgono.**

| Condizione | Esito |
|---|---|
| `4d215ff0e` antenato di HEAD | ✓ (`git merge-base --is-ancestor` esce 0) |
| rotazione del log eseguita, attivo ≤ 20 entry | ✓ esattamente 20 |
| working tree pulito | ✓ `git status --short` vuoto |

**I cinque fatti che contano.**

1. **Il path del prompt è sbagliato di directory.** `components/panels/` non esiste: il
   guscio sta in `components/editors/`. Il file esiste, ha esattamente le 652 righe
   dichiarate, ed è quello giusto — è solo la directory citata a essere falsa (§2.0).
2. **Tre ancore su sei sono spostate**, tutte dentro `PropertiesWithTreeView.tsx`: body
   properties, header tree, body tree. Le altre tre (header properties, slot azioni,
   dispatch di `Info.tsx`) sono esatte (§2.1).
3. **Il restyle del tree non cade nel foglio del rail.** I quattro valori di R-RAIL-7
   vivono in `tree-view-sidebar.scss`, non in `properties-with-tree-view.scss`. La
   condizione di stop del passo 4 **non scatta** (il secondo consumatore del foglio,
   `TreeViewSidebar.tsx`, è morto e non montato), ma il file da toccare è comunque fuori
   dal «foglio del rail» dichiarato in §3 del prompt → **domanda aperta n. 2**.
4. **Il ritiro del passo 2 è interamente locale**: zero consumatori esterni di
   `cardMaximized`, `toggleMaximize*`, `CollapsedPanelToggle` e dello splitter. Ma rende
   inerte una terza chiave di storage non nominata dalle ratifiche,
   `jjodel_property_tree_height` (§4).
5. **Gli otto token entity di C9.1 hanno oggi zero consumatori.** L'arco 1 sarebbe il
   primo (§6.2).

**Gate a baseline, misurati adesso**: typecheck **33** errori (= baseline CLAUDE.md),
`check:docs` **2/2 PASS**. Log attivo a 20 entry: l'entry dell'arco lo porta a 21, quindi
il passo 5 dovrà ruotare, come il prompt già prevede.

---

## 1. File letti

Lettura integrale:

- `frontend/src/components/editors/PropertiesWithTreeView.tsx` (652 righe)
- `docs/redesign/rail/README.md` (418 righe)
- `docs/discovery/discovery_2026-08-10_rail_fase0.md` (1085 righe)
- `frontend/src/components/editor-v2/viewportInset.ts` (35 righe)
- `frontend/src/components/TreeViewSidebar/index.ts`

Lettura mirata:

- `frontend/src/components/editors/Info.tsx` (righe 1165-1245; grep su
  `PropertiesHeader`, `getElementTypeInfo`, `formatMultiplicity`)
- `frontend/src/components/editors/views/ViewData.tsx` (righe 75-115)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (righe 138-150)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (lista import; grep su
  `tree-row`, `tree-feature__type`, `matchCount`, `searchQuery`)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (righe 1670-1790,
  1905-1920; grep su selettori `.tree-row*`)
- `frontend/src/components/editors/properties-with-tree-view.scss` (mappa dei selettori di
  primo livello; grep su lista nera, `z-index`, letterali esadecimali)
- `frontend/src/styles/tokens/_colors-light.scss` (righe 330-364), `_colors-dark.scss`
  (righe 239-265), `_shadows.scss`, `_typography.scss` (righe 10-20, 76-90)
- `frontend/src/styles/tokens.css` (grep su `--shadow-`)
- `frontend/src/pages/components/Dashboard.tsx` (righe 38, 627)
- `docs/decisions.md` (intestazioni di sezione, righe 60-70, 210-240, coda)
- `docs/claude-code-log.md` (entry di testa)

Non letto: `docs/redesign/rail/Jodel Side Panel.dc.html` (1220 righe, 108 KB). Il passo 0
non scrive codice; la clausola 5 delle regole di ingaggio lo richiede «prima di scrivere
codice», quindi la lettura integrale è collocata all'inizio del passo 2.

Non letti perché fuori perimetro: i quattro pannelli di authoring (R-RAIL-1 / C1.1),
`TreeViewSidebar.tsx` oltre alla verifica di montaggio, `TreeViewPanelContext.tsx`.

---

## 2. Le ancore della sezione 3, riga per riga

### 2.0 Correzione di path — la sola che avrebbe fatto scattare la regola 15

Il prompt cita `frontend/src/components/panels/PropertiesWithTreeView.tsx`.

```
$ find frontend/src -name "PropertiesWithTreeView.tsx"
frontend/src/components/editors/PropertiesWithTreeView.tsx
$ find frontend/src -name "properties-with-tree-view.scss"
frontend/src/components/editors/properties-with-tree-view.scss
```

**`frontend/src/components/panels/` non esiste.** La directory giusta è `editors/`, ed è
la stessa che il report di Fase 0 usa (§1 di quel documento). Il conteggio di righe del
prompt (652) coincide con il file reale, quindi si tratta di un refuso di directory, non
di un file diverso. Stessa correzione per gli altri tre path della sezione 3:

| Path nel prompt | Path reale |
|---|---|
| `components/panels/PropertiesWithTreeView.tsx` | `components/editors/PropertiesWithTreeView.tsx` |
| `properties-with-tree-view.scss` | `components/editors/properties-with-tree-view.scss` |
| `Info.tsx` | `components/editors/Info.tsx` (1415 righe) |
| `ViewData.tsx` | `components/editors/views/ViewData.tsx` (294 righe) |

### 2.1 Guscio — `components/editors/PropertiesWithTreeView.tsx` (652 righe)

| Ancora del prompt | Verdetto | Riga reale |
|---|---|---|
| montaggio unico in `Dashboard.tsx:627` | ✓ **esatta** | `<Try><PropertiesWithTreeView mode={'floating'} /></Try>`; import a `:38` |
| 652 righe | ✓ **esatta** | — |
| card PROPERTIES, header `:449-463` | ✓ **esatta** | `<div` a `:449`, `className="properties-panel-header"` a `:450`; l'header chiude a `:480` |
| slot `properties-panel-header__actions` a `:461` | ✓ **esatta** | `<div className="properties-panel-header__actions">` a `:461`, `<HelpButton helpKey="properties-panel" />` a `:462` |
| lo slot non è più bersaglio di portale | ✓ **confermata** | nessun `createPortal` verso quella classe in tutto `frontend/src`; il commento `:456-460` documenta il ritiro (Q4) |
| body `:477` | ✗ **FALSA** | `<div className="properties-panel-body">` è a **`:481`** |
| il body contiene `<Info>` più la sezione NODE gated su `advanced` | ✓ **confermata** | `<Info …>` a `:482-486`; `{advanced && (…)}` a `:489-506`, con `NodeEditor` a `:502` |
| card TREE VIEW, header `:548` | ✗ **FALSA** | `<div` a **`:551`**, `className="tree-view-panel-header"` a **`:552`**; chiude a `:571` |
| body `:568` con `<TreeViewContent/>` | ✗ **FALSA** | `<div className="tree-view-panel-body">` a **`:572`**, `<TreeViewContent />` a **`:573`** |

Lo scostamento delle tre ancore false è di +3, +4 e +5 righe: coerente con un file cresciuto
in testa dopo la rilevazione. Nessuna ancora punta a codice diverso da quello descritto.

### 2.2 Inspector

| Ancora del prompt | Verdetto | Riscontro |
|---|---|---|
| `Info.tsx:1172-1235` — dispatch polimorfo esistente | ✓ **esatta** | `selectedView` a `:1172`, `selectedViewClass` a `:1173`, il gate a `:1174` |
| la view vince sul model element | ✓ **confermata** | `if (tab && selectedView && (…DViewPoint.cname \|\| …DViewElement.cname))` a `:1174`, con `return` anticipato a `:1186-1205`: header, breadcrumb e overview del ramo model element non vengono mai resi per una view |
| poi si discrimina su `className` del `__raw` | ✓ **confermata** | `(selectedView as any)?.__raw?.className` a `:1173`; `DViewPoint` → `<ViewpointProperties>` `:1189-1193`, `DViewElement` → `<ViewData>` `:1195-1201` |
| switch sul model element | ✓ | `switch (ddata?.className)` a `:1211`, dodici casi + `default: <Empty/>`, chiude a `:1235`. `ddata` è `data?.__raw \|\| data` (`:1166`) |
| `ViewData.tsx:80-108` — sceglie il pannello di authoring su `ir.kind` | ✓ **esatta** | `irKind` a `:80-81`; `identity` a `:86`; `renderIRPanel` a `:92-101` con i tre rami vertex/row/edge; `irTabsForKind(irKind, props.advanced)` a `:104` |
| `irTypes.ts:144-145` — `view.ir.kind`, `view.ir.metaclasses` | ⚠ **spostata di una riga** | `interface VertexViewIR` a `:141`; **`kind: 'vertex'` a `:143`** (non 144); `:144` è il commento doc; **`metaclasses: string[] \| '*'` a `:145`** ✓. I campi omologhi di `RowViewIR` / `EdgeViewIR` stanno a `:168`, `:210`, `:252` (numeri da Fase 0, non riverificati) |

### 2.3 Selezione

Confermata la sorgente unica `state._lastSelected` `{node, view, modelElement}`, e
confermata l'assenza di un concetto di «elemento a fuoco» distinto (§7.4 di Fase 0, non
rimisurato qui — nessun elemento di questo passo lo contraddice).

Nota rilevante per il passo 3: **`Info.tsx` rende già un identity block**. `PropertiesHeader`
è definito a `Info.tsx:877-903` e reso a `:1284`; usa `getElementTypeInfo(className)`
(`:847-874`) e produce badge + nome + kind. Il chip di firma non c'è
(`formatMultiplicity` è a `:127-133`, consumato dal badge `jj-bounds-badge` a `:436`).
→ **domanda aperta n. 3**: identity block nel guscio *e* `PropertiesHeader` dentro `Info`
si sommerebbero.

---

## 3. Fogli di stile consumati da `TreeViewContent`

### 3.1 Il grafo degli import

`TreeViewContent.tsx` **non importa alcun foglio di stile**. La sua lista di import
(`:1-27`) è: react, react-redux, `../../joiner`, tipi di viewpoint, `TreeViewPanelContext`,
`utils/lastViewpoint`, `events/registry`, `useNodeProblems`, `problems/registry`. Dipende
quindi dal foglio importato dall'host.

`tree-view-sidebar.scss` (2053 righe) è importato da due soli punti:

| Import | Stato |
|---|---|
| `components/editors/PropertiesWithTreeView.tsx:11` | **vivo** — è il rail |
| `components/TreeViewSidebar/TreeViewSidebar.tsx:5` | **morto** |

### 3.2 `TreeViewSidebar.tsx` è confermato non montato

```
$ grep -rn "TreeViewSidebar" frontend/src --include="*.tsx" --include="*.ts" \
    | grep -v "components/TreeViewSidebar/"
components/abstract/Dock.tsx:281:  // Tree View tab removed - now using dedicated TreeViewSidebar component
components/editors/PropertiesWithTreeView.tsx:7:  import { TreeViewContent } from '../TreeViewSidebar/TreeViewContent';
components/editors/PropertiesWithTreeView.tsx:11: import '../TreeViewSidebar/tree-view-sidebar.scss';
```

Fuori dalla sua directory il componente `TreeViewSidebar` non è mai importato: l'unica
occorrenza del nome è un **commento** in `Dock.tsx:281`, e i due import di
`PropertiesWithTreeView` puntano a `TreeViewContent` e al foglio, non al componente. Il
re-export `TreeViewSidebar/index.ts:1` non ha consumatori. **249 righe di codice morto,
come dichiarato dal prompt fra i punti fuori scopo.**

**Conclusione operativa**: `tree-view-sidebar.scss` ha **un solo consumatore vivo**, il rail.
La condizione di stop del passo 4 («foglio condiviso con altri consumatori vivi») **non
scatta**.

### 3.3 Le quattro ancore di R-RAIL-7, dove stanno davvero

| Valore di R-RAIL-7 | Selettore | Ancora | Stato oggi |
|---|---|---|---|
| suffisso di tipo in mono | `.tree-feature__type` | `tree-view-sidebar.scss:1907-1915` | `font-size: 11px`; **nessun `font-family`** → eredita il sans. Reso a `TreeViewContent.tsx:765` (feature: `: {typeName} [{multiplicity}]`) e `:720` (istanza: `: {metaclassName}`) |
| riga 26px | `.tree-row` | `tree-view-sidebar.scss:1699-1710` | nessuna altezza fissata: `padding-top/bottom: 4px` + contenuto |
| nome 13px, peso 500 | `.tree-row__name` | `tree-view-sidebar.scss:1765-1775` | `font-size: 11px`, **peso non dichiarato**. Reso a `TreeViewContent.tsx:654` (e `:1470`, `:1479` per rule/helper JjTL) |
| peso 600 sul selezionato | `.tree-row--selected` | `tree-view-sidebar.scss:1740-1750` | esiste solo la **pill** `::before` con `var(--color-selection-bg)`; nessuna regola sul peso del nome |

**Esclusività delle classi**: `.tree-row` e `.tree-feature__type` sono definite solo in
`tree-view-sidebar.scss` (l'unico altro file che nomina `.tree-row` è
`_colors-light.scss`, in un **commento**). Un solo file fuori da `TreeViewContent.tsx` cita
`.tree-row` in TSX: `components/forEndUser/Tooltip.tsx:167`, ma dentro una **stringa di
selettori** per l'aggancio dei tooltip ai container di scroll — non una definizione di
stile. Il restyle non ricade su nessun altro consumatore.

**Due avvertenze sul foglio del tree**, entrambe da non «correggere» (regole 8 e 10):

1. `.tree-feature__type:1909` usa oggi `color: var(--color-text-tertiary)` — **un nome in
   lista nera R-RAIL-6**, preesistente. Il passo 4 aggiunge `font-family` a questo stesso
   blocco: la riga `color` resta com'è.
2. Il foglio lavora su variabili SCSS `$` locali (`$radius-sm`, `$transition-fast`,
   `$color-text-primary`, `tree-view-sidebar.scss:5-41`), cioè il «sistema D» di Fase 0
   §3.4, con valori divergenti dal canone. Il codice nuovo del passo 4 consuma `var(--…)`,
   non le `$` locali; ne risulterà una convivenza dei due stili nello stesso file. È il
   prezzo del riuso e non è evitabile senza rinominare (vietato dalla regola 2).

---

## 4. Consumatori della meccanica da ritirare

**Nessun consumatore esterno.** Tutto vive in `PropertiesWithTreeView.tsx` e nel suo foglio.

### 4.1 `cardMaximized` e i due `toggleMaximize*`

| Ruolo | Riga |
|---|---|
| stato `cardMaximized` | `PropertiesWithTreeView.tsx:248` |
| `toggleMaximizeTree` | `:249` — consumato a `:553` (`onDoubleClick` header tree) |
| `toggleMaximizeProperties` | `:250` — consumato a `:451` (`onDoubleClick` header properties) |
| derivato `effectiveMax` | `:413` — consumato a `:417`, `:419`, `:423`, `:437`, `:517`, `:537` |
| `treeFloatStyle` / `propsFloatStyle` | `:417-426` |
| classe `card-header-only` | applicata `:437`, `:537`; **stile** `properties-with-tree-view.scss:1340` |
| commento esplicativo del meccanismo | `:245-247`, `:411-416` |

### 4.2 `CollapsedPanelToggle`

| Ruolo | Riga |
|---|---|
| render lato properties | `:510` |
| render lato tree | `:577` (con `pulse={attentionPulse}`) |
| interfaccia props | `:628-634` |
| componente | `:636-650` |
| stile | `properties-with-tree-view.scss:540-580` (`.collapsed-panel-toggle`), `:582` (`__pulse`) |
| commento di blocco | `:623-627` |

### 4.3 Splitter

| Ruolo | Riga |
|---|---|
| JSX `tree-view-panel-vsplit` | `:517-528`, con `__grip` a `:526` |
| stile | `properties-with-tree-view.scss:1307-1325`, dark a `:1364` |
| handler `handleResizeStart` | `:109-155` |
| stato `treeHeight` + persistenza | `:97-107` |
| helper `clampTreeHeight` | `:60-63` |
| costanti | `:52-55` (`DEFAULT_TREE_HEIGHT`, `MIN_TREE_HEIGHT`, `MAX_TREE_HEIGHT`, `STORAGE_KEY_TREE_HEIGHT`) |

**Da NON confondere con lo splitter — sopravvivono:**

- `.properties-panel-resize-handle` (JSX `:442-448`, CSS `:108-143`) è il **bordo sinistro
  della colonna**, cioè il resize di larghezza guidato da `handlePropsResizeStart`
  (`:171-219`). R-RAIL-11 lo conserva, con il clamp da portare a 360.
- `.tree-view-panel-resize-handle` (JSX `:542-550`, CSS `:654`) è gated su `!isFloating`:
  **già irraggiungibile** oggi, perché `mode` ammette solo `'floating'`. È codice morto
  preesistente, non parte del ritiro.

### 4.4 Effetto collaterale: una terza chiave di storage diventa inerte

Rimuovere lo splitter rende morto l'intero ramo `treeHeight`, e con esso
**`jjodel_property_tree_height`** (`:55`), che oggi è viva e scritta a `:105-107`. Non è
nominata da R-RAIL-11 né fra le chiavi che spariscono, quindi ricade nella clausola «se il
ritiro rende inerte una chiave non nominata qui, non rimuoverla: annotala nell'entry di
log». → **domanda aperta n. 4** sulla forma esatta della non-rimozione.

Le altre due chiavi inerti (`jjodel_property_tree_view_width` `:30`,
`jjodel_property_panel_width` `:41`) lo sono **già** — dipendono dai rami `mode === 'tab'`
irraggiungibili — e sono materia di backlog, esplicitamente fuori scopo. Il passo 2 non le
tocca.

---

## 5. `--jj-canvas-right-inset` — scrittore, valore, lettori

**Scrittore unico**: `PropertiesWithTreeView.tsx:351-360`, un `useEffect`.

```ts
useEffect(() => {
    if (mode !== 'floating') return;
    const overlayShown = (activeEditorType === 'model' || activeEditorType === 'metamodel')
        && (showPropertiesPanel || showTreePanel);
    const inset = overlayShown ? overlayWidth + 8 : 0;
    document.body.style.setProperty('--jj-canvas-right-inset', `${inset}px`);
    return () => { document.body.style.removeProperty('--jj-canvas-right-inset'); };
}, [mode, activeEditorType, showPropertiesPanel, showTreePanel, overlayWidth]);
```

- **Valore**: `overlayWidth + 8` px quando l'overlay è mostrato, `0px` altrimenti.
- **Bersaglio**: `document.body.style` (proprietà inline, non un foglio).
- **Condizione**: editor `model` o `metamodel` **e** almeno una delle due card visibile.
- **Cleanup**: la proprietà è rimossa allo smontaggio.
- **Grep esaustivo**: nessun altro scrittore in `frontend/src`.

**Lettori** (tre siti, due meccanismi):

| Lettore | Ancora | Come |
|---|---|---|
| `editor-v2/viewportInset.ts:14` | `getCanvasRightInset()` | `getComputedStyle(document.body).getPropertyValue(...)`, `parseFloat`, fallback 0 |
| `editor-v2/viewportInset.ts:29-34` | `fitPadding(base)` | se inset ≤ 0 ritorna `base` invariato; altrimenti `{top, bottom, left: base, right: \`${inset+20}px\`}` |
| `EditorV2.tsx:3853` | FAB Jodie | `right: 'calc(var(--jj-canvas-right-inset, 0px) + 20px)'` — legge la var direttamente in CSS |

Consumatori di `viewportInset`: `EditorV2.tsx:49` (`fitPadding`, `getCanvasRightInset`) e
`problems/NodeProblemOverlay.tsx:4` (`fitPadding`).

**Conseguenza per il passo 2.** Il contratto è preservato **a condizione che
`overlayWidth` resti la larghezza reale del guscio e che la condizione `overlayShown`
continui a valere quando il rail è a schermo**. Il rischio concreto: se il ritiro dei
`CollapsedPanelToggle` cambia la semantica di `showPropertiesPanel || showTreePanel`, il
canvas si sposta diversamente da prima. Il valore `+8` è il gutter e non va toccato.

---

## 6. Nomi esatti dei token

### 6.1 `--shadow-*` — sono diciotto, non quattro

Il prompt chiede «i nomi esatti dei quattro `--shadow-*`». La famiglia è più larga; la
lista nera di R-RAIL-6 la scrive già come `--shadow-*` (tutta), e la grep di conformità del
passo 5 (`grep -n "var(--shadow-"`) le cattura tutte, quindi **l'operatività non cambia** —
cambia solo il conteggio.

`styles/tokens/_shadows.scss` (dark `:14-23`, light `:33-42`):
`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`,
`--shadow-glow`, `--shadow-inner`, `--shadow-none`.

Alias semantici, stesso file `:52-59`:
`--shadow-button`, `--shadow-button-hover`, `--shadow-card`, `--shadow-dropdown`,
`--shadow-modal`, `--shadow-tooltip`, `--shadow-node`, `--shadow-node-hover`.
Più nove `--smart-elevation-*` (`:69-77`) e sette classi utility `.shadow-*` (`:84-90`).

`styles/tokens.css:194-199` aggiunge `--shadow-xs` e `--shadow-base`, e **ridefinisce**
`sm`, `md`, `lg`, `xl` con la scala Tailwind. È la ragione strutturale del divieto: sui
quattro nomi condivisi il vincitore dipende da `localStorage.theme` (Fase 0 §3.3).

**Composizione a mano richiesta da R-RAIL-10**, colori disponibili come token:
`--color-accent-subtle` = `rgba(51,65,85,0.06)` (`_colors-light.scss:124`) — esattamente
l'anello di focus del design; `--color-node-shadow` = `rgba(15,23,42,0.06)`
(`_colors-light.scss:218`).

### 6.2 I quattro token entity di `4d215ff0e` — otto nomi

Il commit tocca `_colors-light.scss` (+8) e `_colors-dark.scss` (+14, di cui 6 di commento).

**Light — `_colors-light.scss:342-349`**

```
--color-entity-attribute-bg: #D1FAE5;   --color-entity-attribute-fg: #059669;
--color-entity-reference-bg: #CFFAFE;   --color-entity-reference-fg: #0891B2;
--color-entity-operation-bg: #E0E7FF;   --color-entity-operation-fg: #4F46E5;
--color-entity-enum-bg:      #FEF3C7;   --color-entity-enum-fg:      #D97706;
```

**Dark — `_colors-dark.scss:249-256`**, alpha 0.15 sul bg e shade-400 sul fg (divergenza
deliberata dalla regola shade-300 delle prime cinque coppie, dichiarata nel commento
`:232-237`: allineare `enum` la renderebbe identica a `model`).

**Coppie preesistenti**, non da C9.1: `metamodel` `:332-333`, `package` `:334-335`,
`class` `:336-337`, `model` `:338-339`, `viewpoint` `:340-341`. Più due varianti sature,
`--color-entity-viewpoint-saturated` `:354` e `--color-entity-model-saturated` `:355`.

**Consumatori attuali di `var(--color-entity-*)` in tutto `frontend/src`: quattro righe,
tutte sulla coppia viewpoint** — `tree-view-sidebar.scss:1482-1483` e `:1493-1494`. Gli
otto nomi di C9.1 hanno **zero consumatori**: l'arco 1 è il primo. Nessun rischio di
regressione nel consumarli; nessuna necessità di ridefinirli (R-RAIL-9).

### 6.3 Token di selezione — riverificati, spostati di 8 righe

Fase 0 li dava a `_colors-light.scss:352-353`; `4d215ff0e` ha inserito 8 righe sopra.

| Token | Light | Dark |
|---|---|---|
| `--color-selection-bg` | `_colors-light.scss:360` `#e0f7fa` | `_colors-dark.scss:264` `rgba(8,145,178,0.18)` |
| `--color-selection-bar` | `_colors-light.scss:361` `#0891b2` | `_colors-dark.scss:265` `#22D3EE` |

Il commento-TODO che li precede è a `_colors-light.scss:357-359`.

Grep dei consumatori, esaustivo su `frontend/src`:

- `var(--color-selection-bg)` → **due** occorrenze, `tree-view-sidebar.scss:1741` e `:1749`;
- `var(--color-selection-bar)` → **zero**.

Coerente con R-RAIL-4 + R-RAIL-8: l'arco consuma solo `--color-selection-bg`, e
`--color-selection-bar` resta a zero consumatori.

---

## 7. Verifica dei tre identificatori nuovi

```
$ grep -rn "RailPreset\|PRESET_2A" frontend/src
(nessun risultato)
```

`RailPreset` e `PRESET_2A` sono **liberi**. Il terzo identificatore citato dal passo 0 non
è nominato dal prompt: le uniche classi CSS nuove sarebbero quelle del guscio, e la grep
preventiva va rifatta al passo 2 sui nomi concreti scelti, non adesso.

---

## 8. Stato di conformità del foglio del rail, a baseline

Misure su `components/editors/properties-with-tree-view.scss` (1366 righe), utili perché il
passo 5 fa girare le grep su «file toccati».

| Grep | Risultato a baseline |
|---|---|
| 13 nomi in lista nera | **1 occorrenza**, `:735` — ed è **dentro un commento**: `border-bottom: 1px solid #f1f5f9; // var(--color-border-primary);` |
| `var(--shadow-` | **0** |
| letterali esadecimali `#[0-9a-fA-F]{3,8}` | **92** |
| `z-index` | `:115` (11), `:661` (10), `:853` (100), `:1191` (900), `:1274` (900), `:1333` (5) |

Due conseguenze operative:

1. **La grep dei letterali esadecimali del passo 5 non può girare sul file intero**: 92
   occorrenze preesistenti la renderebbero rossa sempre. Va applicata al **diff**
   (`git diff -U0 … | grep '^+' | grep -E '#[0-9a-fA-F]{3,8}\b'`), non al file. Lo stesso
   vale per la grep `font-family:` e, in misura minore, per la lista nera.
2. **L'invariante z-index è già soddisfatta**: `.properties-tree-overlay` è a `z-index: 900`
   (`:1274`, con il commento «above canvas + rc-dock, below canvas context-menu (1000) and
   modals»), largamente sopra il pavimento di 200 dell'invariante 3. Nessun intervento.

Confermato anche R-RAIL-13 per costruzione: `PropertiesWithTreeView.tsx:253` legge
`useSelector((state: any) => state.advanced)` e **non importa `useInterfaceMode`**. Basta
non aggiungerlo.

---

## 9. Dipendenze e rischi

1. **Il passo 2 tocca due file, il passo 4 un terzo fuori dal «foglio del rail».** La
   sezione 3 del prompt dichiara `properties-with-tree-view.scss` come foglio dell'arco, ma
   i quattro valori di R-RAIL-7 stanno in `tree-view-sidebar.scss`. Vedi domanda 2.
2. **Il contratto verso il canvas passa per `showPropertiesPanel || showTreePanel`.** Il
   ritiro dei `CollapsedPanelToggle` cambia cosa si rende quando **una sola** delle due
   visibilità è vera. Se la condizione di `overlayShown` si muove, il canvas si sposta
   diversamente da prima — che è esattamente ciò che la definition of done vieta. Va
   verificato con le quattro combinazioni (entrambe, solo tree, solo properties, nessuna).
3. **`jjodel_treeview_visible` e `TreeViewPanelContext` sono intoccabili**, ma la
   visibilità del tree continua ad arrivare da lì (`:269-277`) e ⌘B continua a commutarla
   (`:387-395`). Il guscio unico deve limitarsi a **non rendere** il pane quando è falsa.
   Nessuna riscrittura della semantica.
4. **`jjodel_property_tree_height` diventa inerte** (§4.4).
5. **Doppio identity block** se il passo 3 aggiunge il proprio senza considerare
   `PropertiesHeader` (§2.3).
6. **Il tema.** Ogni valore scritto adesso sui nomi non in lista nera è deterministico; i
   13 vietati no. Il rischio residuo è che una regola *ereditata* (da `variables.scss` su
   `body`, es. `--input-height` = 36px e non 40px) faccia sballare un'altezza. Fase 0 §3.4
   lo documenta; se un valore non torna in devtools, è la prima cosa da guardare.
7. **Sette commit locali non pushati** (i sei di Fase 0 più `10dc25879`). Se Slice C venisse
   riscritta, i commit dell'arco andrebbero ribasati con essa. Nessun conflitto di merito.
8. **Il report di questo passo resta untracked** finché non lo si committa, ma il passo 1
   dichiara «nessun altro file» oltre a `docs/decisions.md`. Vedi domanda 5.

---

## 10. Domande aperte per Alfonso

1. **La postura Browse/Focus è nell'arco 1?** È la domanda che decide il passo 2. Il
   preset `2a` del design **è** «Adaptive rail»: il tree pane collassa a 0px in Focus, e con
   la postura arrivano la barra breadcrumb di Focus (design §6), il bottone Focus/Browse in
   header, `Esc`, `J`/`K`. Ma i cinque passi del prompt non la nominano mai, la sezione 1
   descrive l'arco come «guscio + slot + restyle del tree», e la build order del design la
   colloca al suo passo 5, dopo i tre che questo arco copre. **La mia lettura: fuori
   dall'arco 1.** Se è così, il tree pane resta ad altezza fissa e serve saperne il valore:
   i 392px del design in postura Browse, oppure `flex` sullo spazio residuo? (Lo splitter e
   `treeHeight` spariscono, quindi l'altezza non è più trascinabile in nessun caso.)
2. **Il restyle del tree in quale file?** Due strade, entrambe legittime:
   **(a)** modificare i quattro blocchi in `tree-view-sidebar.scss` (`:1699`, `:1740`,
   `:1765`, `:1907`) — diff minimo, quattro righe, ma tocca un file fuori dal «foglio del
   rail» della sezione 3;
   **(b)** scrivere le quattro regole in `properties-with-tree-view.scss` sotto un
   discendente del guscio — resta dentro il foglio dichiarato, ma introduce override di
   specificità superiore su classi di un altro componente, che è il genere di cosa che si
   paga più tardi.
   **Raccomando (a)**: il foglio ha un solo consumatore vivo (`TreeViewSidebar` è morto), la
   condizione di stop del passo 4 non scatta, e le quattro proprietà sono esattamente dove
   già vivono le loro gemelle. Serve solo che sia dichiarato come ampliamento di scope.
3. **L'identity block del passo 3 sostituisce `PropertiesHeader` o gli si somma?**
   `Info.tsx:877-903` rende già badge + nome + kind, ed è reso a `:1284` per ogni elemento
   di metamodello. Un identity block nel guscio, senza toccare `Info`, li mostrerebbe
   entrambi. Toccare `Info.tsx` per sopprimerlo è fuori dai file dichiarati dal passo 3 →
   è la stessa richiesta di ampliamento di scope della domanda 2, su un altro file.
4. **`jjodel_property_tree_height`: cosa vuol dire «non rimuoverla»?** Due letture:
   (a) le costanti `:52-55` e `clampTreeHeight` restano nel file con un `// TODO: cleanup`
   (letterale rispetto alla regola 9 di CLAUDE.md, ma lascia codice morto dichiarato);
   (b) sparisce il codice e resta il valore in `localStorage` degli utenti, non purgato,
   annotato nell'entry di log. **Raccomando (b)**: è ciò che la clausola sembra proteggere
   (i dati dell'utente), e (a) lascerebbe un helper senza chiamanti che il prossimo lettore
   dovrà comunque interrogare.
5. **Il report va committato, e dove?** P4 e la regola 16 chiedono che un report di
   discovery sia committato nel task che lo produce, ma il passo 1 dice «nessun altro file»
   oltre a `docs/decisions.md`. Propongo un commit `docs:` a sé per questo report, subito
   prima del passo 1.
6. **Minori, rispondibili in una riga ciascuna.**
   - `MIN_OVERLAY_WIDTH` va da 320 a **360** (R-RAIL-11). Il **default** resta 400
     (`:47`), o va a 420 come il design? Il valore persistito degli utenti esistenti vince
     comunque su entrambi.
   - Nel guscio unico, il **pin** (`:464-472`) e l'**HelpButton** (`:461-463`) migrano
     nell'unico header, giusto? Nessuna ratifica li nomina.
   - Il **footer** del design (§8, 34px, stato di salvataggio + hint di scorciatoia) è
     fuori dall'arco 1? Richiederebbe di cablare uno stato di persistenza che oggi non
     esiste. La mia lettura: fuori.

---

## 11. Definition of done del passo 0 — verifica

| Criterio | Stato |
|---|---|
| Guard di deriva verificato e riferito | ✓ §0 |
| Ancore della sezione 3, riga per riga | ✓ §2 — 1 correzione di path, 3 ancore false, 1 spostata di una riga |
| Fogli consumati da `TreeViewContent` | ✓ §3 |
| Consumatori di `cardMaximized`, `toggleMaximize*`, `CollapsedPanelToggle`, splitter | ✓ §4 — nessuno esterno |
| Scrittore e valore di `--jj-canvas-right-inset` | ✓ §5 |
| Nomi di `--shadow-*` e dei token entity di `4d215ff0e` | ✓ §6 — la famiglia shadow è di 18 nomi, non 4 |
| `RailPreset` / `PRESET_2A` non esistono già | ✓ §7 |
| Nessuna modifica sotto `frontend/src/` | ✓ §11.1 |
| Hard stop prima del passo 1 | ✓ |

### 11.1 `git status --short` a fine passo

```
?? docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md
```

Nessuna riga sotto `frontend/src/`. Read-only rispettato.

### 11.2 Gate a baseline

| Gate | Esito |
|---|---|
| `npx tsc --noEmit` | **33** errori — coincide con la baseline di CLAUDE.md §17 |
| `npm run check:docs` | **2/2 PASS**, 0 warning |
| `npm run build` | non eseguito: nessun sorgente toccato |
