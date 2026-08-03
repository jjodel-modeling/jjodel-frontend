# Discovery READ-ONLY: substrato condiviso dell'arco "Espressivita' edge v2" (E-mark / E-lab / E-route)

**Data**: 2026-08-03. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `c9b961343` (*fix(editor-v2): disable inline editing of IR-authored edge labels*). Working tree con WIP estraneo (lane TextStyle + report non tracciati), lasciato intatto. Uniche scritture: questo report + l'entry in `docs/claude-code-log.md`. Nessun edit al codice, nessuno stash/checkout/commit/push.

**Documento prompt**: 2026-08-02 17:20.

## Obiettivo

Mappare **una volta sola** il substrato condiviso delle tre slice dell'arco (E-mark, E-lab, E-route), con `file:riga` verificati a HEAD, in modo che i tre prompt di implementazione si possano scrivere senza altre esplorazioni. Non propone implementazioni: propone opzioni con il loro costo. Dichiara esplicitamente quali slice toccano la critical zone e quali no.

Continuazione di `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` e `discovery_2026-07-26_edge_authoring_substrate.md`: i loro findings non sono ripetuti, sono citati e ri-verificati solo dove gli anchor sono cambiati.

---

## Correzioni agli anchor ereditati (ri-ancorati via grep a HEAD `c9b961343`)

| Anchor citato nei documenti precedenti | Valore reale a HEAD |
|---|---|
| `UnifiedEdge.tsx:62-76, 477-484, 486-488, 592-599` — "lo stile IR e' DEAD WRITE" (discovery 2026-07-26 Q4) | ❌ **OBSOLETO**. Il file e' oggi **823 righe** e E0/E0b hanno chiuso il buco: lo stile IR **e' consumato** (`irPathStyle` `:536-542` applicato al path visibile `:729`), i marker sono IR-driven (`:523-532` + defs `:645-706`), la label IR e' sempre visibile (`:568`). **Restano dead write solo `irRoutingHint` e `irLabelPlacement`** (grep: zero consumer) |
| `irEdgeViews.ts:49-72` (`applyEdgeStyle`) | ❌ spostato: `:35-67` |
| `irEdgeViews.ts:118-257` (decoration) | ❌ spostato: `decorateReferenceEdges` `:114-139`, `synthesizeObjectAsEdges` `:164-255` |
| `irCompile.ts:382-428` (`compileEdgeView`) | ❌ spostato: `:404-450`; `isObjectAsEdge` `:430`; terminazioni default `:436-439` |
| `EditorV2.tsx:1915-1918` (reconnect scrive lo slot) | ❌ spostato: `:1883-1886` |
| `EditorV2.tsx:1308-1331` (idratazione layout) | ❌ spostato: `:1341-1364` |
| `canvasToJjom.ts:90-101` (`syncIREdgeLayoutToJjom`) | ❌ spostato: `:105-116` (`SetFieldAction` `:114`) |
| `EdgeAuthoringPanel.tsx` 442 righe, terminazioni `:396-413` | ❌ **cambiato con E-obj**: oggi **626 righe**; terminazioni `:578-594`, natura `:385-395`, capi `:500-530` |
| `__tests__/edgeAuthoring.test.ts` 136 righe | ❌ oggi **267 righe** (i 7 casi proposti dalla discovery E-obj sono stati implementati) |
| `EnableIRPanel.tsx:8-12` `KIND_OPTIONS` "Edge (reference)" | ❌ oggi l'etichetta e' **"Edge (line)"** (`:8-12`) |
| `ViewData.tsx:61` `showIRTab`, routing `:84-105` | ✅ corretto e invariato (`:61`, `:84-105`, ramo edge `:94`) |
| `irResolveCore.ts:44-60` (bucket), `:256-290` / `:293-320` (resolver) | ✅ corretti e invariati |
| `portDistribution.ts` role-aware bucket keys (CLAUDE.md §3.10) | ✅ confermato: `:88` `${edge.source}:${sourceSide}:source`, `:121` `${edge.target}:${targetSide}:target` |

**Nota di processo**: `EdgeMarkerEditorModal.tsx` + `markerPresets.ts` + `InteractivePathCanvas.tsx` + `pathDataModel.ts` (≈2100 righe complessive) **non erano citati in nessuna delle discovery precedenti**. Sono il ritrovamento piu' rilevante di questa sessione per E-mark (§A / OQ-5).

---

## File letti (path completi, tutti sotto `/Users/alfonso/jjodel`)

**Renderer edge (integrale)**: `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` (823).
**Geometria (integrale)**: `frontend/src/components/editor-v2/utils/edgeUtils.ts` (1624), `frontend/src/components/editor-v2/utils/handlePosition.ts` (292), `frontend/src/components/editor-v2/utils/portDistribution.ts` (325, **critical zone, sola lettura**).
**IR core (integrale)**: `viewpoint/ir/irTypes.ts` (379), `irCompile.ts` (502), `irEdgeViews.ts` (255), `irResolveCore.ts` (363), `irValidate.ts` (25), `irDefaults.ts` (144), `irEdgeInteraction.ts` (129), `viewpoint/ir/IRNodeContent.tsx` (299).
**IR (parziale)**: `viewpoint/ir/useIRContainment.ts` (`:100-186`).
**Authoring (integrale)**: `viewpoint/authoring/EdgeAuthoringPanel.tsx` (626), `viewpoint/authoring/TextSourceEditor.tsx` (88).
**Authoring (parziale)**: `viewpoint/authoring/EnableIRPanel.tsx` (`:1-15`), `editors/views/ViewData.tsx` (grep mirato `:28-31`, `:61`, `:84-105`).
**Design system (integrale)**: `components/ui/Select/Select.tsx` (114), `components/ui/JjSelect/JjSelect.tsx` (183), `components/ui/PathBuilder/PathBuilder.tsx` (144), `components/ui/PathBuilder/pathExpr.ts` (27), `components/ui/index.ts`.
**Marker legacy (integrale)**: `components/editors/EdgeMarkerEditorModal.tsx` (501), `components/editors/markerPresets.ts` (251).
**Marker legacy (grep)**: `components/editors/views/data/PaletteData.tsx` (`:25`, `:721-727`, `:844-863`), `components/editors/InteractivePathCanvas.tsx` (827, non letto integralmente), `components/editors/pathDataModel.ts` (588, non letto integralmente).
**Canvas / sync**: `editor-v2/EditorV2.tsx` (`:133-181`, `:1000-1110`, `:1310-1390`, `:1850-1936`, `:3340-3392`), `editor-v2/components/DynamicHandles.tsx` (315), `editor-v2/edges/EndpointHandles.tsx` (`:1-60`), `editor-v2/sync/canvasToJjom.ts` (`:85-125`, `:790-845`, `:1396-1426`, indice completo degli export — **critical zone, sola lettura**).
**CSS**: `editor-v2/EditorV2.scss` (`:2060-2274`).
**Test (indice)**: `viewpoint/authoring/__tests__/edgeAuthoring.test.ts` (267), `viewpoint/ir/__tests__/ir.test.ts` (indice dei `describe`/`it`).
**Documenti**: `CLAUDE.md`, `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md`, `discovery_2026-07-26_edge_authoring_substrate.md`, `discovery_2026-08-02_edge_label_editability.md`.

**Non presenti nel repo** (KB, non ispezionabili in questa sessione): `ratifiche_2026-08-02_edge_expressiveness_v2.md`, `spec_2026-07-26_ir_edge_authoring_addendum.md`, `ratifiche_2026-08-02_eobj_object_as_edge.md`, `mappa_sintassi_concreta.md`. Verificato con `find`: `docs/specs/` contiene solo `spec_2026-07-18_ir_schema_v1_2.md` e `design_2026-07-21_ir_authoring_surface_slice1.md`.

---

# Findings

## Area A — Marker e terminazioni (E-mark)

### OQ-1 — Come sono disegnate oggi le terminazioni

**Sono `<marker>` SVG inline, in un `<defs>` locale a ogni singolo edge, con id namespacizzati per-edge.** Non c'e' nessun `<defs>` condiviso, nessun componente React di marker, nessun path inline.

Sito esatto: `UnifiedEdge.tsx:579-707` (il blocco `<defs>` del CASE 3, l'edge standard). Il blocco e' diviso in tre gruppi mutuamente esclusivi:

| Gruppo | Righe | Gate |
|---|---|---|
| Marker **classici** reference (rombo pieno, rombo vuoto, freccia) | `:581-622` | `!isInheritance` |
| Marker **classico** inheritance (triangolo) | `:625-640` | `isInheritance && !isERNotation` |
| Marker **IR** (5, uno per `EdgeTermination` non-`none`) | `:645-706` | `isIREdge` (`:98`, `!!data.irEdgeViewId`) |

Un quarto marker esiste nel CASE 1 (inheritance ad albero): `treeMarkerId = inheritance-triangle-group-${target}`, `:388`, defs `:398-413`.

Gli id sono costruiti a `:357-360` (classici) e `:365-369` (IR), tutti con suffisso `-${id}` dell'edge ⇒ **un edge non puo' mai referenziare il marker di un altro**, ne' un IR quello classico.

**Mappatura completa dai sei valori di `EdgeTermination` (`irTypes.ts:169-175`) al glifo**, via `irMarkerUrl` (`UnifiedEdge.tsx:372-382`):

| `EdgeTermination` | riga `irMarkerUrl` | marker id | defs | `d` | classe CSS | stile inline |
|---|---|---|---|---|---|---|
| `none` | `:379-380` | — (`undefined`) | — | — | — | — |
| `openArrow` | `:374` | `ir-arrow-open-${id}` | `:648-658` | `M 0 0 L 10 5 L 0 10` | `reference-marker arrow` | `irMarkerStrokeStyle` |
| `closedArrow` | `:375` | `ir-arrow-closed-${id}` | `:659-669` | `M 0 0 L 10 5 L 0 10 Z` | `reference-marker filled` | `irMarkerFillStyle` |
| `hollowTriangle` | `:376` | `ir-triangle-hollow-${id}` | `:670-680` | `M 0 0 L 12 5 L 0 10 Z` | `inheritance-marker` | `irMarkerStrokeStyle` |
| `filledDiamond` | `:377` | `ir-diamond-filled-${id}` | `:682-692` | `M 0 4 L 6 0 L 12 4 L 6 8 Z` | `reference-marker filled` | `irMarkerFillStyle` |
| `hollowDiamond` | `:378` | `ir-diamond-hollow-${id}` | `:694-704` | `M 0 4 L 6 0 L 12 4 L 6 8 Z` | `reference-marker hollow` | `irMarkerStrokeStyle` |

Consumo: `markerStart` `:523-527` (ramo `isIREdge ? irMarkerUrl(irSourceTermination) : …`), `markerEnd` `:529-532`, applicati sul path visibile `:730-731`.

**Nota di scalabilita' rilevante per E-mark**: il blocco `:645-706` emette **tutti e cinque** i marker per ogni edge IR, indipendentemente dalle due terminazioni effettivamente usate. Con N edge IR il DOM contiene 5N `<marker>`. Allargare la famiglia a 15+ voci moltiplicherebbe questo numero: **la famiglia estesa richiede di emettere solo i marker realmente referenziati** (2 per edge), non 15N. E' il primo vincolo implementativo di E-mark, e non e' un dettaglio: e' un cambio di forma del blocco `<defs>`.

### OQ-2 — Sistema di coordinate (il contratto per i marker custom)

Verificato attributo per attributo su tutti i `<marker>` di `UnifiedEdge.tsx`.

| Attributo | openArrow / closedArrow | hollowTriangle | filledDiamond / hollowDiamond |
|---|---|---|---|
| `viewBox` | `0 0 10 10` (`:651`, `:662`) | `0 0 12 10` (`:673`) | `0 0 12 8` (`:685`, `:697`) |
| `refX` | `10` | `7` | `0` |
| `refY` | `5` | `5` | `4` |
| `markerWidth` | `8` | `12` | `12` |
| `markerHeight` | `8` | `10` | `8` |
| `orient` | `auto` | `auto` | `auto` |
| `markerUnits` | **assente** | **assente** | **assente** |

Quattro fatti che compongono il contratto:

1. **`markerUnits` non e' dichiarato in nessun punto del codebase** — verificato con `grep -rn "markerUnits"` su tutto `frontend/src`: **0 occorrenze**. Il default SVG di `markerUnits` e' `strokeWidth`. Conseguenza operativa: **`markerWidth`/`markerHeight` sono moltiplicati per lo `stroke-width` del path**. Poiche' `irPathStyle` scrive `strokeWidth` inline (`:539`) dal `line.width` autorato, **le terminazioni IR scalano gia' proporzionalmente allo spessore della linea, gratis**. (Nota di controllo: lo stroke di default del path IR viene dalla classe CSS `.reference-edge` = `stroke-width: 1`, quindi a spessore 1 la freccia e' 8×8 px.)

2. **`orient="auto"`** su tutti: il marker e' ruotato sulla tangente del path nell'endpoint. Il path visibile e' l'output di `roundManhattanPath` / `buildFinalPath` (`:264-272`), quindi la tangente terminale e' la direzione dell'ultimo segmento — **sempre ortogonale** (0/90/180/270°) tranne che nei self-loop (`computeSelfLoopCornerPath`, `edgeUtils.ts:648-730`, anch'esso ortogonale a meno dell'arrotondamento). Questo cambia con E-route: su bezier la tangente diventa arbitraria e i glifi ruoteranno di angoli non retti — comportamento corretto ma mai visto finora.

3. **Punto di aggancio**: `refX`/`refY` e' il punto del viewBox che viene sovrapposto all'endpoint della linea. Le frecce hanno `refX = 10` in un box `0..10` ⇒ **la punta atterra esattamente sul bordo del nodo** e il glifo si estende all'indietro lungo la linea. I rombi hanno `refX = 0` ⇒ il glifo **parte** dall'endpoint e si estende in avanti (convenzione UML del rombo sul lato sorgente). Il triangolo ha `refX = 7` su 12, cioe' e' rientrato di 5 unita'.

4. **Convenzione di direzione**: con `orient="auto"` l'asse **+X locale del marker punta nella direzione di percorrenza della linea (source → target)**. Su `markerEnd` questo significa "verso il nodo target"; su `markerStart` significa **ancora "verso il target"**, cioe' il glifo sul capo sorgente e' orientato *entrante* nel resto della linea, non uscente. E' esattamente perche' i rombi hanno `refX=0` e non `refX=12`.

**Riga di help copiabile per l'autore di un marker custom** (assumendo che E-mark adotti il box `0 0 10 10` — vedi sotto):

> Disegna il glifo dentro un riquadro `0 0 10 10`. L'asse X va nel verso della linea (sorgente → destinazione); il punto (10, 5) e' quello che appoggia sul bordo del nodo di destinazione, il punto (0, 5) quello che appoggia sul bordo del nodo di partenza. Il glifo viene ruotato automaticamente sulla linea e scalato con lo spessore della linea. Sono ammessi solo i comandi di path SVG (M, L, Q, C, A, Z).

**Perche' `0 0 10 10`**: e' gia' il box delle due frecce IR (`:651`, `:662`) **ed e' il box dichiarato da tutti e 17 i preset di `markerPresets.ts`** (campo `viewBox: '0 0 10 10'`, ogni singolo preset). I due box "storici" `0 0 12 10` (triangolo) e `0 0 12 8` (rombi) sono ereditati dai marker classici e sono l'unica cosa che impedisce di dire "il contratto e' uno solo". **Normalizzare i cinque marker IR su `0 0 10 10` e' un cambio di aspetto minuscolo** (il triangolo passerebbe da 12×10 a 10×10, il rombo da 12×8 a 10×10) **ma e' un cambio visivo su comportamento committato** (regola 3): va deciso, non fatto di nascosto.

### OQ-3 — Ereditarieta' del colore della linea nei marker

**Non c'e' nessun `context-stroke` e nessun `currentColor` funzionante.** Il colore arriva da due strati sovrapposti, entrambi espliciti.

**Strato 1 — classe CSS** (`EditorV2.scss:2082-2111`):
```
.reference-marker.filled  { fill: var(--edge-marker-stroke); stroke: var(--edge-marker-stroke); stroke-width: 1;   }
.reference-marker.hollow  { fill: var(--edge-marker-fill);   stroke: var(--edge-marker-stroke); stroke-width: 1.5; }
.reference-marker.arrow   { fill: none;                      stroke: var(--edge-marker-stroke); stroke-width: 1.5; }
.inheritance-marker       { fill: var(--edge-marker-fill);   stroke: var(--edge-marker-stroke); stroke-width: 1;   }
```

**Strato 2 — override inline quando `line.color` e' autorato** (`UnifiedEdge.tsx:548-549`):
```
irMarkerFillStyle   = irStroke ? { fill: irStroke, stroke: irStroke } : undefined   // forme piene
irMarkerStrokeStyle = irStroke ? { stroke: irStroke }                 : undefined   // forme vuote / frecce
```
passati come `style` sul `<path>` **interno** al marker (`:657`, `:668`, `:679`, `:691`, `:703`). Il commento `:545-547` documenta l'intenzione: le forme piene tingono fill+stroke, le vuote solo il contorno, cosi' l'interno resta vuoto.

**Risposta secca per il path custom: NON eredita niente gratis.** Un `<path d={custom}/>` senza classe e senza `style` renderebbe con i default SVG (`fill: black`, `stroke: none`) — nero pieno, indipendentemente dal colore della linea. E-mark deve quindi decidere, per ogni marker custom, **due cose che il glifo da solo non porta**: (a) se e' pieno o vuoto, (b) quale dei due oggetti di stile applicargli.

Questa e' esattamente la coppia che `MarkerPreset` gia' modella: `fill: 'currentColor' | 'white' | 'none'` + `stroke: 'currentColor' | 'none'` (`markerPresets.ts:10-11`). Attenzione: **`'currentColor'` li' e' un token, non CSS funzionante** — il modal lo risolve a mano in `#334155` (`EdgeMarkerEditorModal.tsx:311`, `:426`). Se E-mark riusa il tipo `MarkerPreset`, deve risolvere `currentColor` → `irStroke` allo stesso modo, oppure impostare `color: irStroke` sul `<marker>` (mai fatto oggi) per rendere `currentColor` genuinamente vivo.

### OQ-4 — Gli stessi marker sono usati dalle edge classiche non-IR?

**No, i marker sono fisicamente distinti.** Le due famiglie non si toccano:

- id diversi: `diamond-filled-${id}` / `diamond-empty-${id}` / `arrow-${id}` / `inheritance-triangle-${id}` (`:357-360`) contro `ir-*-${id}` (`:365-369`);
- defs diversi: `:581-640` (classici) contro `:645-706` (IR);
- selezione mutuamente esclusiva: `markerStart` `:523-527` e `markerEnd` `:529-532` scelgono il ramo IR **prima** di ogni altro (`isIREdge ? … : …`).

**Ma condividono due cose, e sono quelle la superficie di regressione:**

1. **Le classi CSS**: `reference-marker.filled/.hollow/.arrow` e `inheritance-marker` (`EditorV2.scss:2082-2111`) sono usate da entrambe le famiglie. Toccarle e' una regressione garantita sugli edge classici M2. **E-mark non deve toccare quel blocco SCSS.**
2. **La geometria e' duplicata letteralmente**: `M 0 0 L 10 5 L 0 10` compare a `:619` (classico) e `:657` (IR); `M 0 4 L 6 0 L 12 4 L 6 8 Z` a `:593`, `:606` (classici) e `:691`, `:703` (IR); `M 0 0 L 12 5 L 0 10 Z` a `:409` (tree), `:636` (classico) e `:679` (IR). Cambiare la copia IR **non** tocca le classiche — il che e' una buona notizia per il rischio, ma significa anche che una "normalizzazione dei viewBox" (OQ-2) resta confinata al ramo IR.

**Superficie di regressione reale di E-mark**: il file `UnifiedEdge.tsx`, e dentro di esso il blocco `<defs>` `:579-707` e la funzione `irMarkerUrl` `:372-382`. Entrambi sono dentro un componente **condiviso** da `reference` / `inheritance` / `composition` / `instanceRef` (`EditorV2.tsx:124-129`) — quindi un errore di sintassi JSX o un `<defs>` mal chiuso abbatte anche il class diagram M2. Non e' una condivisione *logica*, e' una condivisione *di file*.

Nota: `edges/ManhattanEdge-toDelete.tsx:255` contiene una copia del vecchio rendering ma **non e' registrato in nessun `edgeTypes`** (verificato in `discovery_2026-08-02_edge_label_editability.md` §D3 e non contraddetto qui). Non e' superficie di regressione.

### OQ-5 — Esiste gia' un registro di glifi riusabile?

**Si', e non e' un analogo lontano: e' quasi esattamente cio' che E-mark deve costruire, gia' scritto e gia' funzionante su un'altra superficie.**

**`frontend/src/components/editors/markerPresets.ts`** (251 righe):
- tipo `MarkerPreset` (`:6-13`): `{ name, category, path /* la sola d */, fill: 'currentColor'|'white'|'none', stroke: 'currentColor'|'none', viewBox }`;
- tipo `PresetCategory` (`:15-18`);
- `MARKER_PRESETS: PresetCategory[]` (`:23-207`) — **7 categorie, 17 preset**, tutti con `viewBox: '0 0 10 10'`:

| Categoria | Preset |
|---|---|
| None | No Marker (`path: ''`) |
| Arrows | Open Arrow, Filled Arrow, Thin Arrow, Notched Arrow |
| Diamonds | Open Diamond, Filled Diamond |
| Circles | Open Circle, Filled Circle |
| Bars | Simple Bar, Double Bar |
| UML | Inheritance, Aggregation, Composition, Association |
| **Multiplicity** | **`[0] Zero`, `[1] One`, `[0..*] Many`, `[0..1] Optional`, `[1..*] OneOrMany`** |

La famiglia **"zampe di gallina" ER richiesta da E-mark esiste gia', per intero**: `[0..*] Many` = `M 10 1 L 0 5 L 10 9 M 10 5 L 0 5` (`:174`), `[1..*] OneOrMany` = `M 0 0 L 0 10 M 10 1 L 0 5 L 10 9 M 10 5 L 0 5` (`:198`), `[0..1] Optional` = `M 3 0 A 3 3 0 1 1 3 6 A 3 3 0 1 1 3 0 Z M 8 0 L 8 10` (`:190`), `[1] One`, `[0] Zero`.

- helper: `getAllPresets()` (`:212`), `findPresetByPath(path)` (`:219`), `getDefaultStyles(path)` (`:225-238`).

**E c'e' anche l'editor custom**, gia' scritto: **`components/editors/EdgeMarkerEditorModal.tsx`** (501 righe) — lista preset con **thumbnail SVG** (`:304-316`, `<svg viewBox="-1 -1 12 12"><path d={preset.path}/></svg>`), canvas interattivo con maniglie draggabili (`InteractivePathCanvas.tsx`, 827 righe), editor Monaco sul `d` grezzo (`:463-471`), toggle filled/outline (`:333-348`), zoom (`:364-375`), **live preview su una linea campione con `<marker>` reale** (`:402-451`), e un `onApply(path: string)` che restituisce **esattamente la sola stringa `d`** (`:185-188`) — cioe' precisamente la forma di dato che l'opzione **custom** di E-mark deve raccogliere.

**Chi lo consuma oggi**: **solo la palette classica**. `PaletteData.tsx:25` (import), `:721-727` (bottone "Edit marker" per prefisso head/tail), `:846-863` (montaggio). L'`onApply` scrive in `view.palette[prefix].value` come `PathControl` (`:853-857`) — cioe' nel **substrato jsxString/palette delle view classiche**, non nell'IR. **Zero accoppiamento con l'IR: nessun import incrociato in nessuna direzione** (verificato con grep su `EdgeMarkerEditorModal` e `markerPresets`).

**Interazione col vincolo Bootstrap Icons (CLAUDE.md §7.1)**: **nessun conflitto.** La regola vieta *librerie di icone* diverse da Bootstrap Icons; qui non si tratta di icone ma di **path SVG disegnati a mano**, che sono gia' la norma nel codebase per la grafica di dominio: `IRNodeContent.tsx:169-178` (rombo del diamond), `markerPresets.ts` (17 path), `ProviderIcons.tsx` (SVG inline per DeepSeek/Mistral). Nessuna nuova dipendenza (regola 4). L'unico punto in cui Bootstrap Icons entra in E-mark e' la chrome del picker (chevron, bottone rimuovi) — che gia' usa `bi bi-*` ovunque.

**Costo implicito**: se E-mark adotta `markerPresets.ts` come sede del registro, quel file passa da "usato da una superficie" a "condiviso fra due superfici" (classica + IR). E' una promozione di responsabilita' su un file esistente: va detto, perche' cambia chi puo' modificarlo senza rompere l'altro consumatore.

### OQ-6 — Rendere `EdgeTermination` aperto: cosa si rompe

Forma attuale: union chiusa di 6 stringhe letterali, `irTypes.ts:169-175`.

**Elenco completo dei siti che nominano il tipo o i suoi valori** (grep esaustivo su `EdgeTermination` e su tutti e sei i letterali, esclusi i test):

| # | Sito | Cosa fa | Si rompe con un tipo aperto? |
|---|---|---|---|
| 1 | `irTypes.ts:169-175` | dichiarazione | — (e' il punto da modificare) |
| 2 | `irTypes.ts:204` | `EdgeViewIR.edge.terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination }` | no — allargare il tipo di una proprieta' **opzionale gia' esistente** e' additivo (regola 11) |
| 3 | `irTypes.ts:275` | `CompiledEdgeView.terminations: { sourceEnd: EdgeTermination; targetEnd: EdgeTermination }` | no — proprieta' **required gia' esistente**, il cui tipo si allarga; l'unico costruttore e' il #4 |
| 4 | `irCompile.ts:436-439` | `sourceEnd: e.terminations?.sourceEnd ?? 'none'`, `targetEnd: … ?? 'openArrow'` | **no** — non c'e' nessuno `switch`, nessun match, solo due default. Compila identico |
| 5 | `irEdgeViews.ts:61-62` | copia i due valori su `data.irSourceTermination` / `irTargetTermination` | **no** — pura copia; e i campi su `data` sono gia' letti come `string \| undefined` (`UnifiedEdge.tsx:102-103`) |
| 6 | `UnifiedEdge.tsx:372-382` | `irMarkerUrl(t: string \| undefined)` — `switch` sui 5 valori + `default: return undefined` | **no, ed e' il punto chiave: la firma e' gia' `string`, non `EdgeTermination`, e ha gia' un `default`.** Un valore sconosciuto oggi produce "nessun marker", non un errore. Il tipo e' **gia' de facto aperto a runtime** |
| 7 | `EdgeAuthoringPanel.tsx:42-49` | `TERMINATION_OPTIONS`, lista letterale scritta a mano (non derivata dal tipo) | no — ma **va estesa a mano**: non c'e' nessun meccanismo che la tenga in sync col tipo |
| 8 | `EdgeAuthoringPanel.tsx:584`, `:592` | `e.target.value as EdgeTermination` | no — sono **cast**, non narrowing; nessuna esaustivita' |
| 9 | `EdgeAuthoringPanel.tsx:337-338` | default di lettura `?? 'none'` / `?? 'openArrow'` | no |
| 10 | `irDefaults.ts:75` | commento | no |

**Verdetto: non esiste in tutto il codebase un `switch`/match esaustivo tipizzato su `EdgeTermination` senza `default`.** Aprire il tipo **non rompe nulla in compilazione**. Il gate reale non e' la tipizzazione, e' che i due punti che *usano* il valore (`irMarkerUrl` e i defs) devono ricevere la stringa `d`, che oggi non c'e' da nessuna parte.

**Forma additiva compatibile con la regola 11** (una proprieta' opzionale, tipo allargato — nessun campo nuovo obbligatorio, nessun bump di `irVersion`):
```
type EdgeTermination = 'none' | 'openArrow' | … | 'hollowDiamond' | { custom: string /* la d */; filled?: boolean }
```
Cambia solo il tipo dei due campi `sourceEnd`/`targetEnd` gia' esistenti (#2) e il tipo compilato (#3). `irHash` (`irCompile.ts:266-271`, `JSON.stringify` + djb2) e la cache di compile funzionano invariati su un valore-oggetto. Alternativa: mantenere `EdgeTermination` chiuso e aggiungere `terminations?: { …, sourceCustom?: string, targetCustom?: string }` — piu' additiva ancora, ma introduce uno stato invalido rappresentabile (`sourceEnd: 'openArrow'` + `sourceCustom` valorizzato) che il validatore dovrebbe intercettare, e `irValidate.ts` oggi **non fa alcun cross-check** (`:16-25`, e' un wrapper di 10 righe attorno a `compileEdgeView`).

### OQ-7 — Che `Select` sono le due delle terminazioni, e ammette JSX nelle opzioni?

**Sito**: le due Select del blocco terminazioni sono `EdgeAuthoringPanel.tsx:581-585` (Sorgente) e `:589-593` (Destinazione), alimentate dalla costante letterale `TERMINATION_OPTIONS` (`:42-49`). Il componente e' importato dal barrel del design system (`:4-16`, `from '../../../ui'`) ed e' **`ui/Select`**.

**Che componente e': un `<select>` HTML nativo.** `components/ui/Select/Select.tsx` (114 righe, letto integralmente):
- props: `SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>` (`:12`), piu' `size`, `options: SelectOption[]`, `placeholder`, `error`, `fullWidth`;
- `SelectOption` (`:6-10`) = `{ value: string; label: string; disabled?: boolean }` — **`label` e' tipizzato `string`, non `ReactNode`**;
- render (`:82-107`): un `<div>` wrapper, un `<select>` nativo, e il map delle opzioni a `:92-100`:
  ```
  <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
  </option>
  ```
- l'unico elemento grafico del componente e' la chevron Bootstrap fuori dal `<select>` (`:103-105`, `<i className="bi bi-chevron-down"/>`).

**Risposta secca: NO, non ammette JSX nelle opzioni. E non e' una limitazione del wrapper, e' del DOM.** Anche allargando il tipo di `label` a `ReactNode`, i browser non renderizzano markup dentro `<option>`: il contenuto viene appiattito a testo. **Non esiste una modifica di `ui/Select` che sblocchi l'anteprima grafica** — sarebbe un cambio di tecnologia, non una prop in piu'.

**Conseguenza per E-mark: l'anteprima grafica NON e' gratis, ma e' cheap, e le due strade praticabili esistono gia' in repo, senza nuove dipendenze (regola 4).**

**(a) `JjSelect`** — `components/ui/JjSelect/JjSelect.tsx` (183 righe, letto integralmente): wrapper su `react-select`, dipendenza gia' presente (`package.json:61`, `"react-select": "^5.10.1"`), **gia' esportata dal barrel** (`ui/index.ts`, `export { JjSelect } from './JjSelect'`) e **gia' in uso** in `components/editors/Info.tsx` e `components/forEndUser/Input.tsx`. react-select rende ogni opzione con un componente React, quindi accetta JSX arbitrario (via `formatOptionLabel` o un `components.Option` custom — il file gia' fa override di `DropdownIndicator` `:102-123`, `MultiValueRemove` `:128-138`, `ClearIndicator` `:142-152`, quindi il seam e' battuto). Costo: sostituire il componente nelle due Select + ~10 righe di renderer d'opzione che emette la thumbnail SVG **gia' scritta** nel marker modal (`EdgeMarkerEditorModal.tsx:304-316`, `<svg viewBox="-1 -1 12 12"><path d={preset.path} …/></svg>`). Prezzo: nel pannello convivrebbero due Select visivamente diverse (le altre restano native); e `JjSelect` porta con se' il proprio sistema di stili inline (`buildStyles`, `:27-99`), tarato sul Property Panel.

**(b) Griglia di bottoni con thumbnail** — il pattern e' gia' implementato e funzionante a `EdgeMarkerEditorModal.tsx:298-319`: un `<button>` per preset, con `<svg>` del glifo e il nome accanto, piu' la classe `--active` sull'opzione corrente (`:301`, predicato `isPresetActive` `:210-212`). Costo: ~30 righe di JSX locale al pannello + SCSS. Zero rischio su componenti condivisi, e **scala meglio di un dropdown** su una famiglia estesa a 15+ voci (i 17 preset di `markerPresets.ts` in un `<select>` sarebbero una lista lunga e cieca). Prezzo: rompe l'uniformita' del form, dove ogni altro campo e' una Select.

**(c) Estendere `ui/Select`**: **non e' un'opzione** — vedi sopra, il vincolo e' `<option>`, non il wrapper.

Nota trasversale: qualunque strada si scelga, il glifo mostrato nell'anteprima deve risolvere la politica fill/stroke della voce (OQ-3), altrimenti la thumbnail e il marker reso sul canvas non coincidono — nel modal quella risoluzione e' fatta a mano a `:311` (`preset.fill === 'currentColor' ? '#334155' : preset.fill === 'white' ? '#ffffff' : 'none'`).

---

## Area B — Label (E-lab)

### OQ-8 — Rendering e posizionamento della label centrale

**Un solo sito**: `UnifiedEdge.tsx:758-787`, dentro `<EdgeLabelRenderer>` (`:759`), il portale React Flow che monta il contenuto in un overlay DOM sopra il canvas.

Struttura: un `<div className="edge-label …">` (`:763-772`) posizionato **in coordinate assolute via CSS transform** (`:765-769`):
```
transform: translate(-50%, -50%) translate(${10 + labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)
```
Da notare il **`10 +` hardcoded** a `:767`, che non ha commento e non e' una costante nominata (le costanti `ROLE_LINE_GAP*` sono `:41-44`).

Catena del posizionamento:
1. `labelPos` (`:279-285`) = `computeLabelPosition(spreadPath, roleArcShift)` → `edgeUtils.ts:799-833`. E' il **punto a meta' della lunghezza d'arco** della polilinea, clampato in `[margin, total-margin]` con `margin = min(12, total/2)` (`:819-820`), piu' `arcOffset` per de-sovrapporre i bundle. Restituisce anche `isHorizontal` = orientamento del segmento ospite (`:826`).
   Nel caso self-loop il punto viene invece da `selfLoopGeom.labelPoint` (`:280-282`, geometria `edgeUtils.ts:715-718`).
2. `labelOffset` (`:288-291`): spinta perpendicolare, `{x: 10, y: -10}` su segmento orizzontale, `{x: 10, y: 0}` su verticale.
3. `roleArcShift` (`:275`) arriva da `edge.data`, precalcolato in `EditorV2.applyDistribution` (`:1062-1078`) per i soli edge di tipo `reference` (`ROLE_TYPES`, `:1042`) — quindi **mai per un edge IR** (che e' `instanceRef`/`composition`).

**Visibilita'**: `refLabelVisible` (`:566-572`). Un edge IR con label autorata e' **sempre visibile** — `(isIREdge && irLabelAlwaysVisible)` a `:568`, dove `irLabelAlwaysVisible` viene da `data` (`:104`) e vale `labelText !== undefined` (`irEdgeViews.ts:64`). Gli altri M1 compaiono su hover/selezione/toggle globale.

**Gate di montaggio del portale**: `showLabelPortal = refLabelVisible || cardinalityVisible || isaLabelVisible` (`:575`), usato a `:758`. E' una ottimizzazione dichiarata (`:555-565`: `EdgeLabelRenderer` registra una subscription che fa un `querySelector` full-DOM a ogni notifica dello store). **Ogni label nuova deve entrare in questo predicato, altrimenti non monta.** E' il tipo di dettaglio che costa mezza giornata se scoperto a valle.

**`edge.labels.placement`**: tipo `'auto' | 'above' | 'below'` (`irTypes.ts:209`), compilato in `CompiledEdgeView.labelPlacement` con default `'auto'` (`irCompile.ts:442`), emesso su `data.irLabelPlacement` (`irEdgeViews.ts:57`).
**Consumatori: ZERO.** Grep esaustivo su `irLabelPlacement` in tutto `frontend/src`: 2 occorrenze, entrambe in `irEdgeViews.ts` (il commento `:52` e la scrittura `:57`). **E' un dead write** (stessa categoria di `irRoutingHint`). Nemmeno il pannello lo autora: `EdgeAuthoringPanel.tsx:356-357` lo *preserva* se gia' presente ma non lo scrive mai. Se E-lab vuole `above`/`below` deve implementarne il consumo da zero — e' lavoro nuovo, non "attivazione".

### OQ-9 — Punti geometrici agganciabili agli estremi

**Esistono gia', e sono prop di primo livello.** Non vanno calcolati.

1. `sourceX`, `sourceY`, `targetX`, `targetY` arrivano da React Flow via `EdgeProps` (destrutturati `UnifiedEdge.tsx:62-76`) e sono **le posizioni degli handle sul bordo del nodo** — cioe' esattamente i punti in cui la linea tocca i due nodi.
2. `sourceSide` / `targetSide` sono gia' derivati a `:153-154` (`getSideFromHandle`, `edgeUtils.ts:26-31`).
3. **Esiste gia' un helper che ancora un box appena fuori dal nodo, all'altezza dell'handle di entrata**: `computeCardinalityAnchor(targetX, targetY, targetSide, boxGap, depthShift)` (`edgeUtils.ts:879-896`), consumato a `:294-301`. Copre tutti e quattro i lati e applica una spinta laterale (`CARD_LINE_GAP = 4`, `:868`) perche' il testo stia **accanto** alla linea, non sopra. E' scritto per il capo target ma e' **parametrico sul lato**: chiamarlo con `(sourceX, sourceY, sourceSide, …)` produce l'ancora del capo sorgente **senza una riga di geometria nuova**.
4. Prova che le coordinate sono corrette a render time: `EndpointHandles` (`:745-756`, componente `edges/EndpointHandles.tsx:34-56`) disegna gia' i pallini di drag esattamente in `(sourceX, sourceY)` e `(targetX, targetY)`.

**Costo geometrico delle label agli estremi: ~zero.** Il lavoro sta altrove:
- due `<div>` in piu' sotto `<EdgeLabelRenderer>` e la loro inclusione in `showLabelPortal` (`:575`);
- la **collisione con il badge di cardinalita'**, che occupa gia' l'ancora del capo target. Ma `showCardinality` (`:353`) e' `(uml || wireframe) && !isInheritance && !isM1Edge` ⇒ **falso su ogni edge IR** (che e' sempre `instanceRef`/`composition`, cioe' `isM1Edge`). **Sugli edge IR l'ancora target e' libera.** La collisione esiste solo se un giorno una edge view decorasse un edge M2 — cosa che `decorateReferenceEdges` esclude per costruzione (`irEdgeViews.ts:124`, filtra `instanceRef`/`composition`).
- la de-sovrapposizione fra label di estremo di edge diversi che condividono lo stesso handle: oggi non esiste alcun meccanismo analogo a `cardShift` (`EditorV2.tsx:1044-1060`) per gli edge M1, perche' `CARD_TYPES` (`:1041`) contiene solo `reference`.

**File**: `UnifiedEdge.tsx` (il grosso) + eventualmente un helper esportato in piu' in `utils/edgeUtils.ts` (**fuori** critical zone).

### OQ-10 — Estensione additiva di `edge.labels` con `source` e `target`

| File | Intervento | Additivo puro? |
|---|---|---|
| `irTypes.ts:207-210` | due proprieta' **opzionali** dentro l'oggetto `labels` gia' opzionale: `source?: TextSource; target?: TextSource` | ✅ si' — regola 11 rispettata alla lettera |
| `irTypes.ts:277-278` (`CompiledEdgeView`) | due campi compilati accanto a `labelText` | ⚠️ e' un'**interfaccia esportata**. Aggiungerli come `?:` e' additivo puro. Aggiungerli come required romperebbe ogni literal che costruisce un `CompiledEdgeView`: ne esiste **esattamente uno** (`irCompile.ts:422-444`), quindi anche il required sarebbe meccanicamente sanabile — ma la regola 11 impone l'opzionale |
| `irCompile.ts:441` | due chiamate in piu' a `compileTextSource(e.labels?.source, deps)` / `(…?.target, deps)`. `compileTextSource` (`:380-400`) e' gia' generico su qualsiasi `TextSource`; `deps` e `crossPaths` sono raccolti automaticamente dallo stesso sink (`:409-411`, `:445-447`) | ✅ si' |
| `irValidate.ts` | **nessuna modifica**. E' un wrapper che chiama `compileEdgeView` e cattura il throw (`:16-25`); una PathExpr malformata nelle nuove label esplode da `compilePath` esattamente come per la centrale | ✅ nessun tocco |
| `irEdgeViews.ts:53-65` (`applyEdgeStyle`) | due chiavi in piu' su `data`. ⚠️ `irLabelAlwaysVisible` (`:64`) e' oggi derivato **dalla sola label centrale**: la regola di visibilita' delle label di estremo va decisa, non ereditata | ✅ additivo, ⚠️ una semantica da decidere |
| `UnifiedEdge.tsx:566-575`, `:758-787` | il lavoro vero: due div nuovi + `showLabelPortal` esteso | additivo nel comportamento (assenti le chiavi, rendering byte-identico) |

**Verdetto: additiva pura sul lato IR**, con l'unico punto di attenzione sull'interfaccia esportata `CompiledEdgeView` (risolto usando proprieta' opzionali) e la decisione semantica su `irLabelAlwaysVisible`.

Nessun bump di `irVersion` (le view esistenti restano valide e compilano identico), coerente con il vincolo dell'arco.

### OQ-11 — Edit della label: stato **dopo** il fix `c9b961343`

Il fix e' **landed a HEAD**. Il report `docs/discovery/discovery_2026-08-02_edge_label_editability.md` (letto integralmente) descrive lo stato *pre-fix* e la modifica prevista; qui si registra lo stato *post-fix* verificato sul sorgente, senza rifare il lavoro.

**Dove nasce l'affordance** (invariato): un solo sito, il div della label centrale, `UnifiedEdge.tsx:762-787`. Due gesture:
- doppio click, `:770`: `onDoubleClick={(e) => { e.stopPropagation(); if (!labelEditable) return; setEditing(true); }}`
- click su edge gia' selezionato, `:771`: `onClick={(e) => { e.stopPropagation(); if (labelEditable && selected) { setEditing(true); return; } selectEdge?.(id); }}`
- ramo di render dell'input, `:773`: `{editing && labelEditable ? <input …/> : …}`

**Il gate**: `const labelEditable = !isIREdge;` a **`UnifiedEdge.tsx:113`**, con la motivazione nel commento `:105-112`. `isIREdge = !!irData.irEdgeViewId` a `:98`.

⇒ **Su ogni edge IR-decorato (entrambe le nature) l'affordance e' rimossa**; il click continua a selezionare l'edge (`selectEdge?.(id)` a `:771` resta raggiungibile), il che era il vincolo R5 del report precedente ed e' rispettato. Sugli edge classici il comportamento e' byte-identico a prima: `commitLabel` (`:317-337`) e `onKeyDown` (`:339-349`) sono intatti e ancora chiamati da `onBlur` (`:779`) / `Enter`.

**Perche' il valore non raggiungeva il modello** (ri-verificato a HEAD, non riderivato):
- **object-as-edge**: l'id sintetico e' `irobj_${objectId}` (`irEdgeViews.ts:205`), che **non e' un pointer JjOM**; `syncEdgeRefProperty` fa `LPointerTargetable.fromPointer(edgeId)` → `undefined` → `console.warn('edge not found')` → `return` (`canvasToJjom.ts:815-819`). Nessuna scrittura.
- **reference-as-edge decorata**: l'id **e'** un pointer, e `edgeProxy.model` e' la **DReference M2**; la scrittura arriva a destinazione ma rinomina la reference del **metamodello** (`canvasToJjom.ts:820-823`), mentre la label a schermo — ri-seminata da `cv.labelText` a ogni ricalcolo (`irEdgeViews.ts:41`, `:45`) — torna indietro.

**Cosa E-lab eredita**: tutto il materiale e' in piedi e non e' stato rimosso (`commitLabel`, `onKeyDown`, lo stato `editing`, il ramo di render dell'input, `syncEdgeRefProperty`). E-lab deve fare due sostituzioni: **(i)** rimpiazzare `!isIREdge` con il flag di editabilita' autorato + la scrivibilita' della sorgente (OQ-13); **(ii)** rimpiazzare `syncEdgeRefProperty` con una scrittura verso lo slot risolto (OQ-12).

### OQ-12 — Percorso di scrittura all'indietro

**`data.irObjectId` e' raggiungibile dal sito di edit: si', senza una riga di plumbing.**
Il campo e' posato sull'edge sintetico a `irEdgeViews.ts:211`, sopravvive ad `applyEdgeStyle` (che fa lo spread `...(e.data ?? {})`, `:54`), e `UnifiedEdge` legge gia' lo stesso sacchetto non tipizzato (`const irData = (data ?? {}) as Record<string, any>`, `:97`) a 650 righe di distanza dal sito da modificare. Nessun prop drilling, nessun contesto, nessun campo nuovo — la stessa constatazione che il report sull'editabilita' aveva fatto per `irEdgeViewId`.

**Il percorso idiomatico del progetto, con evidenza diretta (non per analogia).**
L'intestazione di `IRNodeContent.tsx:4-6` enuncia la regola come norma:
> *"Fase 3: in-place editing through the canonical EditorV2 write path (canvasToJjom.syncUpdateFeatureValue / syncNodeLabel) — never a new write path (spec v1.2 sez. 5)."*

e la applica: `syncUpdateFeatureValue(vertexId, editingRow.name, editValue)` a `IRNodeContent.tsx:125`, `syncNodeLabel(vertexId, editValue)` a `:132`.
Il corpo di `syncUpdateFeatureValue` (`canvasToJjom.ts:1400-1426`) e' esattamente lo schema LModel/`$attr.value` descritto in CLAUDE.md §9.1:
```
const lVertex = LPointerTargetable.fromPointer(objectVertexId);
const lObject = lVertex?.model;
TRANSACTION(`EditorV2 set ${featureName}`, () => {
    const featureProxy = lObject['$' + featureName];
    if (featureProxy) featureProxy.value = newValue;
});
```

**Passa o non passa da `canvasToJjom.ts` (critical zone)? — Risposta articolata, ed e' quella che decide il rischio di E-lab.**

- **Si', il percorso canonico e' dentro `canvasToJjom.ts`**, che e' in critical zone (CLAUDE.md §3.1).
- **Ma riusare le funzioni esistenti e' un diff ZERO sulla critical zone.** `syncUpdateFeatureValue` e `syncNodeLabel` esistono, sono esportate e fanno gia' esattamente la scrittura che serve.
- **L'unico attrito e' la chiave**: `syncUpdateFeatureValue` prende un **vertexId** e risale con `vertex.model`; l'edge sintetico porta un **objectId**. Tre strade, con costi molto diversi:
  - **(a) risolvere il vertice dall'oggetto e chiamare la funzione esistente invariata.** L'helper esiste gia' ed e' **fuori** dalla critical zone: `irVertexIdForObject(graphId, objectId)` a `EditorV2.tsx:142-151`. **Diff sulla critical zone: zero.** Costo: un passaggio di `graphId` fino al sito di scrittura (oppure la stessa scansione di `subElements`, ~8 righe).
  - **(b) aggiungere in `canvasToJjom.ts` un gemello keyed-by-object.** Nuovo export in un file di critical zone ⇒ **Layer Impact Report obbligatorio** (§3.2) e go-ahead.
  - **(c) scrivere inline fuori da canvasToJjom.** Precedente reale e vivo: `EditorV2.handleReconnect` fa gia' `LPointerTargetable.fromPointer(objectId)` → `lObj['$'+featName]` → `slot.value = newObjId` a **`EditorV2.tsx:1883-1886`**, senza passare da `canvasToJjom`. ⚠️ Ma quel codice **non e' avvolto in TRANSACTION**, a differenza di `syncUpdateFeatureValue` (`canvasToJjom.ts:1415`) — quindi (c) e' un precedente ma non un modello: replicandolo si eredita anche l'omissione.

- **Reference-as-edge: non esiste un bersaglio scrivibile sensato, e l'evidenza e' precisa.** Un edge reference-as-edge **non ha un oggetto proprio**. La sua label, quando autorata, e' una `TextSource` valutata **sull'oggetto SORGENTE**: `decorateReferenceEdges` passa `srcObj` come eval id (`irEdgeViews.ts:136`, `applyEdgeStyle(e, cv, readCtx, srcObj)`). Quindi:
  - una label scrivibile su reference-as-edge scriverebbe **uno slot dell'oggetto sorgente** — tecnicamente coerente, semanticamente sorprendente: **la stessa label compare su tutti gli edge uscenti da quell'oggetto** (una view senza `reference` matcha ogni reference della metaclasse sorgente, `irResolveCore.ts:273-276`), quindi editarne una le riscrive tutte;
  - quando la label **non** e' autorata, il testo e' il nome della DReference M2 (`jjomTransformers` lo mette in `data.referenceName`; `applyEdgeStyle` lascia `e.label` intatto se `labelText === undefined`, `irEdgeViews.ts:45`) — ed e' esattamente il bersaglio sbagliato che il fix `c9b961343` ha appena chiuso.
  ⇒ **La label di una reference-as-edge e' sempre derivata da un oggetto terzo** (il sorgente), mai da un'entita' propria dell'edge.

### OQ-13 — Come stabilire se una label e' scrivibile

**Regola per costrutto di `TextSource`** (`irTypes.ts:50-53`):

| `TextSource` | Scrivibile? | Bersaglio | Evidenza |
|---|---|---|---|
| `{from:'literal', text}` | **Mai** | nessuno — l'accessor e' una closure su una costante | `irCompile.ts:398-399` |
| `{from:'intrinsic', prop:'name'}` | **Si'** | `DObject.name` | writer canonico `syncNodeLabel`, `canvasToJjom.ts:533` |
| `{from:'intrinsic', prop:'qualifiedName'}` | **Si'** (edita la sola parte nome) | `DObject.name` | idem — e' esattamente cio' che fa `editsName` |
| `{from:'intrinsic', prop:'metaclassName'}` | **No** | e' il nome della **metaclasse**, non dell'oggetto | `irCompile.ts:299` |
| `{from:'path', expr}` | **Dipende** — vedi sotto | uno slot dell'oggetto | — |

**Per `path`, due condizioni strutturali, entrambe verificabili staticamente sulla stringa:**
1. **single-hop**: `parsePathExpr` (`irCompile.ts:47-74`) produce `steps`; `steps.length === 1` significa "self". Multi-hop naviga verso un altro oggetto (`irCompile.ts:120-128`) e scriverci richiederebbe l'id di quell'oggetto a write time — fattibile ma e' un'altra scrittura.
2. **valore singolo**: `take === 'value'` (o un indice numerico). `take === 'values'` (array intero) non ha uno slot singolo. ⚠️ E il writer esistente scrive `featureProxy.value = newValue` (`canvasToJjom.ts:1418`), cioe' **semantica di posizione 0**: `values[N]` con `N > 0` **non e' coperto** dal writer attuale.

**Esiste gia' una funzione che valuta la scrivibilita' di un path? NO.**
Grep esaustivo su `editsName` / `isWritable` / `writable` in `frontend/src`: le uniche occorrenze sono `irCompile.ts:308`, `:311`, `irTypes.ts:350`, `IRNodeContent.tsx:196`, `:215` — cioe' **`editsName` e' l'unico valutatore di scrivibilita' del codebase**, e copre solo il caso `intrinsic`:
```
const editsName = l.source.from === 'intrinsic'
    && (l.source.prop === 'name' || l.source.prop === 'qualifiedName')
    && l.editable !== false;                                    // irCompile.ts:308-310
```
Questo e' **il modello da estendere**, non da reinventare: stessa forma (un booleano calcolato a compile time, portato sul compilato, letto dal renderer), stessa semantica di `editable` (`LabelSpec.editable`, `irTypes.ts:80-81`: assente = default editabile).

**Il tipo `PathExpr` semplifica, ma meno di quanto sembra.**
E' vero che `PathBuilder` e' single-hop per costruzione: `pathExprFromSelection` (`pathExpr.ts:18-26`) emette **un solo hop** (`$feature` + `.value`/`.values`/`.values[N]`), e `parseExpr` (`PathBuilder.tsx:30-38`) e' una regex che accetta solo quella forma. Quindi **per una path autorata dal PathBuilder il predicato si riduce a `take !== 'values'`** — cioe' letteralmente lo stesso controllo che `isUsableEndpointExpr` gia' implementa per i capi:
```
function isUsableEndpointExpr(expr) { return !!expr && !/\.values$/.test(expr); }   // EdgeAuthoringPanel.tsx:78-81
```
con tanto di commento che spiega perche' e' scritto puro e senza dipendenze (il test non puo' importare il modulo: joiner → monaco → `window`).

**Ma la grammatica dell'IR ammette il multi-hop** (`irCompile.ts:142-146` raccoglie i `crossPaths`, e il commento di `PathBuilder.tsx:72-73` dichiara il multi-hop come slice futura). Una view puo' arrivare da persistenza, da migrazione o da un'altra superficie. **Un check di scrivibilita' robusto deve rifiutare esplicitamente il multi-hop**, non assumere che il PathBuilder sia l'unico produttore.

Ostacolo pratico: `parsePathExpr` e' **module-private** in `irCompile.ts` (`:47`). Le opzioni sono esportarla (modifica a un file IR core, fuori critical zone) oppure duplicare un predicato di ~10 righe nello stile di `isUsableEndpointExpr`. Il precedente del codebase e' la duplicazione.

---

## Area C — Routing (E-route)

### OQ-14 — Dove e' calcolato il path ortogonale e chi sceglie gli handle

**Il router**: `computeManhattanPath` — nome reale confermato — in **`frontend/src/components/editor-v2/utils/edgeUtils.ts:92-135`**. Chiamato una volta per edge in `UnifiedEdge.tsx:173-176`.

Firma: `(sourceX, sourceY, sourceSide, targetX, targetY, targetSide) => string`. Internamente: `categorizeSidePair` (`:137-142`) classifica la coppia di lati in `opposite-horizontal` / `opposite-vertical` / `same` / `adjacent`, poi delega a `routeOppositeH` (`:145-184`), `routeOppositeV` (`:187-226`), `routeSameSide` (`:229-251`), `routeAdjacent` (`:254-331`); infine `ensureOrthogonalEndpoints` (`:389-444`) forza i tratti terminali perpendicolari al lato (stub di `STUB_LENGTH = 20`, `:19`). `SNAP = 8` (`:106`), `DETOUR_PADDING = 30` (`:16`).

Pipeline a valle nel renderer: `parsePathPoints` (`:179`) → `applyWaypoints` (`:180-183`) → `applyBundleSpread` (`:204-208`) → `getEdgeCrossings` (`:227-231`) → `buildFinalPath` / `roundManhattanPath` (`:264-272`).

**Chi sceglie gli handle: NON il router.** `computeManhattanPath` riceve i due lati **gia' decisi**, letti dagli id degli handle: `sourceSide = getSideFromHandle(sourceHandleId)` (`UnifiedEdge.tsx:153-154` → `edgeUtils.ts:26-31`, che fa `handleId.split('-')[0]`). Gli handle sono assegnati a monte, e **da due meccanismi diversi a seconda della provenienza dell'edge**:

| Provenienza | Chi assegna | File | Critical zone? |
|---|---|---|---|
| Edge **reali** (tutte le reference-as-edge, tutti i classici M2/M1) | `applyDistribution` → `computePortDistribution` (di cui si consuma **solo** `edgeHandles`; `nodeHandles` e' scartato) | `EditorV2.tsx:1026-1099`, chiamata `:1031` → `utils/portDistribution.ts:71-266` | **SI'** (§3.1) |
| Edge **sintetici** object-as-edge | `assignGeometricHandles` — asse dominante fra i centri dei nodi + primo indice libero per `(nodo, lato, ruolo)` | `viewpoint/ir/irEdgeViews.ts:88-111`, con override sessione/persistiti sovrapposti `:233-253` | **NO** |

E dove l'handle **sta fisicamente** sul lato e' un terzo calcolo, ancora indipendente: `computeSidePositions` (`utils/handlePosition.ts:183-251`), consumato da `DynamicHandles` (`:112`, `:241-242`) — l'ordinamento cross-ruolo geometry-aware (per centroide del nodo opposto, `:230-235`, con tiebreak stabile sull'edge id, `:222-225`).

**Verdetto OQ-14: scelta degli handle e routing ortogonale sono DISACCOPPIATI.** Il router e' una funzione pura di `(x, y, side) × 2`; non sa nulla di come quei lati siano stati scelti, e nessuno dei tre meccanismi di assegnazione sa nulla del router.

### OQ-15 — ⚠️ LA DOMANDA CHE DECIDE IL COSTO — direct e bezier possono riusare gli handle?

> ### **SI'. Direct e bezier possono riusare gli handle scelti dalla logica attuale, cambiando solo il path disegnato. E-route NON entra nella critical zone.**

**Evidenza, in tre punti.**

1. **L'input del router e' gia' tutto quello che serve.** `computeManhattanPath` prende `(sourceX, sourceY, sourceSide, targetX, targetY, targetSide)` (`edgeUtils.ts:92-99`). Una retta ha bisogno dei soli due punti; una bezier ha bisogno dei due punti **piu' una direzione di tangente**, e **il lato E' la tangente** — e' esattamente cio' che `stubPoint` (`edgeUtils.ts:338-345`) codifica gia' ("da che parte esce la linea da questo lato"). Entrambi i dati sono nello scope di `UnifiedEdge` senza aggiungere nulla.

2. **React Flow espone gia' gli helper, e sono inutilizzati.** `@xyflow/react` `^12.10.0` (`package.json:27`) esporta `getStraightPath`, `getBezierPath`, `getSmoothStepPath`, `getSimpleBezierPath` — verificato in `node_modules/@xyflow/react/dist/esm/index.d.ts`. `getBezierPath` accetta `sourcePosition`/`targetPosition`, cioe' **la stessa informazione di lato**. Nel progetto sono usati **zero volte**: le uniche occorrenze di `BaseEdge`/`getBezierPath` sono in `edges/ManhattanEdge-toDelete.tsx:3`, `:234`, file registrato in nessun `edgeTypes`. Nessuna dipendenza nuova (regola 4 rispettata).

3. **L'argomento "serve una politica di ancoraggio propria" e' estetico, non di correttezza.** Con una retta o una bezier, l'ordinamento geometry-aware di `computeSidePositions` (che ordina gli endpoint per centroide del nodo opposto, `handlePosition.ts:230-235`) produce comunque un ventaglio sensato e non incrociato. **Nulla si rompe se i lati restano quelli scelti oggi.**

**Dove sta invece il costo vero di E-route — tutto in `UnifiedEdge.tsx`, tutto fuori dalla critical zone.**
L'intera pipeline a valle del router assume **una polilinea ortogonale di punti `M`/`L`**. Sei consumatori che una curva rompe:

| # | Consumatore | Sito | Cosa succede con direct/bezier |
|---|---|---|---|
| 1 | `applyWaypoints` | `edgeUtils.ts:941-973` | Sposta segmenti H/V. Su una retta (2 punti = 1 segmento) salta primo e ultimo (`:954`) ⇒ **no-op totale**. Su una curva, senza significato |
| 2 | `applyBundleSpread` | `edges/bundleSpread.ts` (89 righe), usato `UnifiedEdge.tsx:204-208` | Ventaglia "il corridoio centrale" di una polilinea Manhattan |
| 3 | `getEdgeCrossings` | `edgeUtils.ts:1334-1443` | Rileva **solo** incroci H×V (`:1383`, `:1394`); `buildFinalPath` emette archetti solo su segmenti orizzontali (`:1567`, `:1591`) ⇒ nessun bridge su curve |
| 4 | `registerEdgePath` | `edgeUtils.ts:1304-1312`, chiamato `UnifiedEdge.tsx:217` | ⚠️ **Il peggiore**: il registry module-level riceve i punti della polilinea, che su una bezier **non corrispondono alla forma disegnata**. Un edge curvo avvelenerebbe il crossing detection **degli altri edge** con una polilinea fantasma |
| 5 | `computeLabelPosition` | `edgeUtils.ts:799-833` | Cammina gli stessi punti `M`/`L` (`parsePathPoints`, `:735-747`). Su una `d` bezier `points.length < 2` ⇒ **ritorna `{x: 0, y: 0}`** (`:804`). **E' il modo concreto in cui E-route rompe E-lab**: ogni label di un edge curvo salterebbe all'origine del canvas |
| 6 | `SegmentHandles` | `UnifiedEdge.tsx:735-742` (componente `edges/SegmentHandles.tsx`, 169 righe) | Disegna una maniglia per segmento. Su una curva non ci sono segmenti — ma il componente verrebbe montato lo stesso, offrendo all'utente di creare waypoint inerti |

**Conclusione operativa**: E-route **non** richiede di toccare `portDistribution.ts`, `useJjomSync.ts`, `canvasToJjom.ts`, `syncState.ts`. Richiede **un gate** in `UnifiedEdge.tsx` che, per un routing non ortogonale, scavalchi waypoint / bundle-spread / crossings / segment handles e sostituisca l'ancora della label. E' un intervento **ampio e delicato ma concentrato in un unico componente di 823 righe, fuori dalla critical zone**.

**L'unico scenario che riaprirebbe la critical zone**: se E-route volesse anche **liberta' di ancoraggio per-edge** (es. "gli edge bezier si attaccano al centro del nodo, non su un lato"). Il punto fisico di attacco e' la posizione DOM di un `Handle`, di proprieta' di `DynamicHandles` + `computeSidePositions` + `computePortDistribution`. **E' una scelta di design, non un'imposizione di direct/bezier.** Se venisse scelta, servono go-ahead esplicito + Layer Impact Report.

### OQ-16 — Che fine fanno waypoint e side pin persistiti

Il dato persistito e' `DVertex.irEdgeLayout` (`model/dataStructure/GraphDataElements.tsx:1690`), shape `IRPersistedEdgeLayout` (`irEdgeInteraction.ts:50-54`): `{ sourceSide?, targetSide?, waypoints?: {segmentIndex, offset}[] }`. Scritto da `syncIREdgeLayoutToJjom` (`canvasToJjom.ts:105-116`), idratato una volta per grafo in `EditorV2.tsx:1341-1364`, con gate `persistWaypoints` (`EditorV2.tsx:159-173`).

**Side pin — sopravvivono e restano coerenti.** Sono lati di handle (`PERSISTABLE_SIDES`, `irEdgeInteraction.ts:56`; l'indice sessione-relativo viene **strippato** in `irEdgeLayoutFromOverride`, `:65-82`). Sia direct sia bezier consumano il lato: la retta come punto d'ancoraggio, la bezier anche come tangente. **Nessuna incoerenza.**

**Waypoint — vengono ignorati silenziosamente, senza rompere nulla, ma non vengono cancellati.**
- `segmentIndex` e' un **indice nella lista dei segmenti Manhattan**. Con routing `straight` la polilinea ha 2 punti = 1 segmento, e `applyWaypoints` salta esplicitamente primo e ultimo segmento (`edgeUtils.ts:954`: `if (i === 0 || i === lastSeg) continue`) ⇒ **ogni waypoint diventa un no-op**.
- Con bezier, idem, in piu' l'array di punti non e' la forma disegnata.
- **Non crashano**: `applyWaypoints` fa bounds-check (`:952`, `if (i < 0 || i >= adjusted.length - 1) continue`).
- **Non vengono rimossi dal modello**: restano su `DVertex.irEdgeLayout` e vengono ri-seminati all'apertura successiva (`EditorV2.tsx:1353-1358`).
- ⚠️ **L'unica incoerenza reale e' al ritorno**: tornando a `manhattan`, i waypoint riappaiono con un `segmentIndex` che si riferisce a un conteggio di segmenti che nel frattempo puo' essere cambiato (se gli ancoraggi si sono spostati) ⇒ l'offset atterra su un segmento diverso da quello originale. Geometria strana, mai un crash.
- ⚠️ **Il problema piu' fastidioso non e' il dato ma la UI**: `SegmentHandles` (`UnifiedEdge.tsx:735-742`) verrebbe montato anche su un edge curvo, permettendo all'utente di **creare** waypoint che non fanno nulla — e che vengono comunque persistiti (`handleEdgeChange` → `setIREdgeAnchorOverride` → `persistIREdgeLayout`, `EditorV2.tsx:3372-3383`). Va gatato.

**Helper di path di ReactFlow**: si', `getStraightPath` / `getBezierPath` / `getSmoothStepPath` / `getSimpleBezierPath` sono esportati da `@xyflow/react ^12.10.0` e **oggi non sono usati**. Usarli evita di scrivere a mano la matematica delle curve; **non risolve nessuno dei sei problemi di pipeline sopra**, che restano interamente a carico di `UnifiedEdge`.

---

## Dipendenze e rischi

### Critical zone — in evidenza

| Slice | Tocca la critical zone (§3.1)? | Nota |
|---|---|---|
| **E-mark** | **NO** | Perimetro: `UnifiedEdge.tsx` (defs + `irMarkerUrl`), `irTypes.ts`, `irCompile.ts`, `EdgeAuthoringPanel.tsx`, `markerPresets.ts`. Nessuno e' in §3.1 |
| **E-lab** | **NO se si sceglie la strada (a) di OQ-12** — riuso di `syncUpdateFeatureValue`/`syncNodeLabel` invariati, con la risoluzione objectId→vertexId fatta fuori. **SI' se si sceglie la strada (b)** (nuovo export in `canvasToJjom.ts`) ⇒ go-ahead + Layer Impact Report | E' l'unica decisione dell'arco che sposta una slice dentro o fuori dalla critical zone |
| **E-route** | **NO** (verificato, OQ-15) — a meno che non si voglia liberta' di ancoraggio per-edge, che tocca `portDistribution.ts` ⇒ go-ahead + Layer Impact Report | La critical zone e' letta, mai scritta |

### Rischi

1. **`UnifiedEdge.tsx` e' il collo di bottiglia condiviso delle tre slice.** Tutte e tre atterrano nello stesso file di 823 righe, che e' anche l'**unico renderer di ogni edge dell'applicazione** (`EditorV2.tsx:124-129`: `reference`, `inheritance`, `composition`, `instanceRef`). Non e' una condivisione logica (i rami IR e classico sono ben separati da `isIREdge`), e' una condivisione **di file**: un errore strutturale nel JSX abbatte anche il class diagram M2. Implicazione sull'ordine: **due slice non dovrebbero essere in lavorazione contemporaneamente su questo file.**

2. **E-route rompe E-lab se atterra dopo, senza coordinamento.** `computeLabelPosition` (`edgeUtils.ts:799-833`) su una `d` bezier ritorna `{x: 0, y: 0}` (`:804`): **ogni label — centrale ed estremi — salterebbe all'origine del canvas.** E' l'unico accoppiamento *duro* fra due slice dell'arco, ed e' unidirezionale (E-route → E-lab). Va risolto in E-route, non in E-lab.

3. **`registerEdgePath` e' un registry module-level condiviso da tutti gli edge di tutti i canvas** (`edgeUtils.ts:1300`, filtro per canvas attivo `:1366`). Un edge curvo che vi registra una polilinea fantasma **degrada il crossing-detection degli altri edge**, inclusi quelli classici non-IR. E' l'effetto di E-route piu' facile da non vedere in smoke test.

4. **Il blocco `<defs>` IR emette 5 marker per edge indipendentemente dall'uso** (`UnifiedEdge.tsx:645-706`). Con la famiglia estesa di E-mark il costo DOM cresce linearmente nel numero di voci del registro × numero di edge IR. Va cambiata la forma del blocco (emettere solo i 2 referenziati), il che e' una riscrittura del blocco, non un'aggiunta.

5. **Normalizzare i viewBox dei marker IR e' un cambio visivo su comportamento committato** (regola 3). Oggi i cinque marker hanno tre box diversi (`0 0 10 10`, `0 0 12 10`, `0 0 12 8`, OQ-2). Un contratto unico per l'autore custom richiede di normalizzarli; farlo cambia leggermente l'aspetto di triangolo e rombi sugli edge IR gia' autorati. Va deciso esplicitamente.

6. **`markerPresets.ts` diventerebbe un file condiviso fra due superfici** (palette classica + IR). Oggi ha un solo consumatore (`PaletteData.tsx`). Promuoverlo significa che una modifica al registro puo' rompere l'editor classico, che non ha test.

7. **Il colore non e' ereditato**: un path custom senza classe/style renderebbe nero pieno (OQ-3). Ogni voce del registro deve portare la sua politica fill/stroke, e `'currentColor'` nei preset **non e' CSS funzionante** ma un token risolto a mano (`EdgeMarkerEditorModal.tsx:311`, `:426`). Riusare `MarkerPreset` senza risolvere questo produce marker neri sugli edge colorati.

8. **`edge.labels.placement` e `edge.routing` sono dead write.** Grep: zero consumer per `irLabelPlacement` e `irRoutingHint` (unico sito: la scrittura in `irEdgeViews.ts:56-57`). Trattarli come "gia' pronti da attivare" e' l'errore da non fare: E-lab e E-route devono **implementarne il consumo da zero**. `edge.routing` ha gia' un valore compilato (`irCompile.ts:440`) e un tipo (`'orthogonal' | 'straight' | 'curved'`, `irTypes.ts:206`) — nota che il vocabolario dell'arco (manhattan / direct / bezier) **non coincide** con quello gia' persistito.

9. **`irValidate.ts` non fa alcun cross-check** (`:16-25`, wrapper di 10 righe). Qualunque stato invalido rappresentabile introdotto dai nuovi schemi (marker custom + valore enum insieme, label di estremo scrivibile su una sorgente literal, routing incoerente con waypoint) **non verra' intercettato**. Se il pannello non lo impedisce, lo produrra' — e' lo stesso rischio gia' registrato per gli IR ibridi in E-obj.

10. **La scrivibilita' della label per reference-as-edge non ha un bersaglio proprio** (OQ-12): scriverebbe uno slot dell'**oggetto sorgente**, con l'effetto collaterale che la stessa modifica si riflette su tutti gli edge uscenti da quell'oggetto. Non e' un bug, e' una semantica da ratificare o da vietare.

11. **La natura strutturale resta il vincolo di fondo.** `isObjectAsEdge = !!(sourceExpr && targetExpr)` (`irCompile.ts:430`) e la scrittura atomica dei capi (`EdgeAuthoringPanel.applyEndpoints`, `:162-176`) non vanno indeboliti da nessuna delle tre slice. Nessuna delle tre li tocca per come sono mappate qui, ma ogni aggiunta a `edge.{…}` passa dallo stesso oggetto.

12. **Nessuna delle tre slice ha un banco di prova automatizzato per il rendering.** `ir.test.ts` copre `applyEdgeStyle` e la sintesi, **non** il montaggio di `UnifiedEdge` (non montabile in node: catena `canvasToJjom` → `joiner` → `monaco` → `window`). `edgeAuthoring.test.ts` (267 righe) asserisce **letterali speculari** guidati attraverso `validateIR`/`compileEdgeView` reali, senza importare i componenti (`:9-14`). ⇒ La verifica di E-mark (aspetto dei glifi), E-lab (posizione delle label) e E-route (forma del path) resta **manuale**, a carico di Alfonso.

---

## Domande aperte per Alfonso (alternative con il costo di ciascuna)

**Q1 — E-mark: dove vive il registro dei marker?**
(a) **Riusare `components/editors/markerPresets.ts`**: 0 righe di registro nuove, 17 preset gia' scritti incluse le zampe di gallina, un tipo (`MarkerPreset`) gia' modellato su `{path, fill, stroke, viewBox}`. Prezzo: il file diventa condiviso con la palette classica (rischio 6), e `'currentColor'` va risolto (rischio 7).
(b) **Registro IR dedicato** accanto a `irTypes.ts`: ~120 righe di dati duplicati dal file esistente, zero accoppiamento fra le due superfici, liberta' di adottare subito il box unico `0 0 10 10`. Prezzo: due liste di glifi che divergeranno.
(c) **Registro condiviso nuovo** in `components/ui/` che entrambe le superfici importano: ~150 righe (registro + migrazione di `EdgeMarkerEditorModal` e `PaletteData` al nuovo import). E' la soluzione pulita e la piu' cara.

**Q2 — E-mark: si normalizzano i viewBox?**
(a) **Si', tutti su `0 0 10 10`**: contratto unico e copiabile (OQ-2), allineato ai 17 preset. Prezzo: triangolo e rombi cambiano leggermente aspetto sugli edge IR gia' autorati (regola 3 — cambio visivo su committato, da approvare).
(b) **No, ogni voce porta il suo viewBox/refX/refY** (come gia' fa `MarkerPreset.viewBox`): zero cambi visivi. Prezzo: il custom non ha un contratto unico — la riga di help diventa "dipende dal marker che stai sostituendo", cioe' inutilizzabile.

**Q3 — E-mark: quale widget per l'anteprima grafica?** (OQ-7)
(a) **`JjSelect`** (react-select, gia' dipendenza `package.json:61`, gia' esportato da `ui/index.ts`, gia' usato in `Info.tsx`): ~10 righe di renderer d'opzione con la thumbnail SVG che il modal gia' scrive (`EdgeMarkerEditorModal.tsx:304-316`). Prezzo: due componenti Select diversi nello stesso pannello (le altre Select restano native).
(b) **Griglia di bottoni** con thumb inline (pattern gia' implementato a `EdgeMarkerEditorModal.tsx:298-319`): ~30 righe locali + SCSS, zero rischio su componenti condivisi, scala meglio a 15+ voci di un dropdown. Prezzo: rompe l'uniformita' visiva del form (ogni altro campo e' una Select).
(c) **Estendere `ui/Select`** ad accettare JSX: **impossibile senza cambiare tecnologia** — e' un `<select>` nativo (`Select.tsx:84-101`), i browser non renderizzano markup dentro `<option>`. Non e' un'opzione.

**Q4 — E-mark: dove si autora il `d` custom?**
(a) **Riusare `EdgeMarkerEditorModal`** (501 righe gia' scritte: preset, canvas draggabile, Monaco, live preview, `onApply(path)`): costo ≈ montarlo e collegarne l'`onApply` al draft dell'IR. E' di gran lunga la strada piu' economica. Prezzo: il modal e' scritto attorno all'idea di palette classica (`markerPosition: 'head'|'tail'`) e va verificato che sia riusabile senza modifiche (**non verificato in questa sessione**: `InteractivePathCanvas.tsx` 827 righe e `pathDataModel.ts` 588 non sono stati letti integralmente).
(b) **Un semplice campo di testo per la `d`** dentro il pannello: ~15 righe, nessun rischio, nessuna anteprima interattiva.

**Q5 — E-lab: dove passa la scrittura?** (OQ-12 — **la decisione che sposta E-lab dentro o fuori dalla critical zone**)
(a) **Riuso di `syncUpdateFeatureValue`/`syncNodeLabel` invariati**, risolvendo objectId→vertexId fuori (helper gia' esistente `EditorV2.tsx:142-151`): **diff zero sulla critical zone**, nessun Layer Impact Report. Costo: ~8 righe di risoluzione + il passaggio di `graphId`.
(b) **Nuovo export keyed-by-object in `canvasToJjom.ts`**: piu' pulito semanticamente, ma e' **scrittura in critical zone** ⇒ go-ahead esplicito + Layer Impact Report.
(c) **Scrittura inline in `UnifiedEdge`/`EditorV2`** sul modello di `handleReconnect` (`EditorV2.tsx:1883-1886`): nessun tocco a canvasToJjom, ma **eredita l'omissione della TRANSACTION** di quel precedente. Sconsigliato senza aggiungerla.

**Q6 — E-lab: la label di una reference-as-edge e' editabile?** (OQ-12)
(a) **No, mai**: il flag di editabilita' e' offerto solo sulla natura object. Costo ~2 righe di gate; semantica pulita.
(b) **Si', scrive uno slot dell'oggetto sorgente**: coerente con dove la `TextSource` e' valutata (`irEdgeViews.ts:136`), ma la modifica si riflette su **tutti** gli edge uscenti da quell'oggetto. Costo simile; serve un avviso in UI.

**Q7 — E-lab: qual e' il predicato di scrivibilita'?** (OQ-13)
(a) **Solo `intrinsic name`/`qualifiedName`**, esattamente come `editsName` (`irCompile.ts:308-310`): ~5 righe, zero casi nuovi, ma non copre la label piu' interessante (`$attr.value`).
(b) **`intrinsic` + path single-hop `.value`**: il caso utile; predicato ~12 righe (rifiuto esplicito del multi-hop, non assunto). Serve esportare `parsePathExpr` da `irCompile.ts` oppure duplicare il predicato nello stile di `isUsableEndpointExpr` (`EdgeAuthoringPanel.tsx:78-81`).
(c) **Anche `values[N]`**: richiede un writer che non esiste (`featureProxy.value = …` scrive posizione 0, `canvasToJjom.ts:1418`). **Fuori portata senza nuovo write path.**

**Q8 — E-lab: le label agli estremi sono sempre visibili?**
Oggi `irLabelAlwaysVisible` (`irEdgeViews.ts:64`) e' derivato dalla sola label centrale. Le molteplicita' `0..1` / `1..*` sono informazione strutturale che di norma sta sempre a schermo; le label centrali M1 no. (a) sempre visibili (coerente con l'uso ER/UML, ma sovraccarica il canvas denso), (b) stessa regola della centrale, (c) un flag per label. Costo simile; cambia il carattere del diagramma.

**Q9 — E-route: quale vocabolario?**
`edge.routing` esiste gia' con i valori `'orthogonal' | 'straight' | 'curved'` (`irTypes.ts:206`), compilato (`irCompile.ts:440`) e persistito in eventuali IR gia' salvati. L'arco parla di **manhattan / direct / bezier**. (a) riusare i tre valori esistenti (zero migrazione, nomi meno espliciti), (b) allargare la union con i tre nuovi nomi mantenendo i vecchi come alias (additivo, ma due vocabolari), (c) sostituirli (**romperebbe le view persistite** — sconsigliato: nessun VersionFixer copre `ir`, che non e' `jsxString`).

**Q10 — E-route: cosa succede alle gesture quando il routing non e' ortogonale?**
`SegmentHandles` e i waypoint diventano inerti (OQ-16). (a) **nasconderli** sul routing non ortogonale (~3 righe di gate, l'utente non puo' creare dati inutili), (b) **lasciarli con un avviso** (l'utente scopre da solo che non fanno nulla), (c) **implementare waypoint su curve** (fuori portata: cambia il modello di dato persistito, `{segmentIndex, offset}` non ha senso su una bezier).

**Q11 — Ordine di implementazione.**
L'accoppiamento duro e' **E-route → E-lab** (rischio 2: `computeLabelPosition` ritorna l'origine su una `d` bezier). Le opzioni: (a) **E-mark → E-lab → E-route**, con E-route che si fa carico di riparare l'ancora delle label appena introdotte; (b) **E-mark → E-route → E-lab**, cosi' E-lab nasce gia' consapevole delle curve; (c) **E-mark → E-lab**, E-route rinviata. In tutti i casi E-mark e' indipendente dalle altre due.

---

## Mappa dei file candidati, per slice

### E-mark — registro marker, anteprima, custom

| File | Intervento previsto | Condizionato a |
|---|---|---|
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | **Principale**: riscrittura del blocco `<defs>` IR (`:645-706`) per emettere solo i marker referenziati e per accettare una `d` arbitraria; `irMarkerUrl` (`:372-382`) da mappa fissa a lookup su registro + ramo custom; `markerStart`/`markerEnd` (`:523-532`) invariati nella forma | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `EdgeTermination` (`:169-175`) aperto o affiancato; ricaduta sui tipi `:204` e `:275` (proprieta' gia' esistenti, tipo allargato) | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | `compileEdgeView` (`:436-439`): far arrivare la `d` (e la politica fill/stroke) nel compilato. Nessun match esaustivo da aggiornare | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | `applyEdgeStyle` (`:61-62`): trasporto della `d` su `data` accanto ai due nomi di terminazione | sempre |
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | `TERMINATION_OPTIONS` (`:42-49`) → registro; le due Select (`:578-594`) → widget con anteprima; sezione "custom" | sempre |
| `frontend/src/components/editors/markerPresets.ts` | Nessuna, oppure promozione a registro condiviso | Q1(a)/(c) |
| `frontend/src/components/editors/EdgeMarkerEditorModal.tsx` | Nessuna se riusato as-is; adattamento se l'API `markerPosition` non regge il caso IR | Q4(a) |
| `frontend/src/components/ui/JjSelect/JjSelect.tsx` | **Nessuna** — si usa cosi' com'e' con un renderer d'opzione locale al pannello | Q3(a) |
| `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | Estensione: terminazione custom valida/invalida, round-trip di una `d`, drop-key | sempre |
| `EditorV2.scss` (`:2082-2111`) | **NESSUNA** — condiviso con i marker classici (rischio 4 / OQ-4) | mai |
| **critical zone** (`useJjomSync`, `portDistribution`, `canvasToJjom`, `syncState`) | **NESSUNA** | mai |

### E-lab — label agli estremi + editabilita'

| File | Intervento previsto | Condizionato a |
|---|---|---|
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | **Principale**: due div label negli estremi (ancore da `computeCardinalityAnchor` parametrizzata sul lato, OQ-9); `showLabelPortal` (`:575`) esteso; il gate `labelEditable` (`:113`) da `!isIREdge` al flag autorato + scrivibilita'; commit verso lo slot al posto di `syncEdgeRefProperty` (`:336`) | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `edge.labels` (`:207-210`) + `source?`/`target?`; `LabelSpec.editable` come modello per il flag; `CompiledEdgeView` (`:277-278`) + campi **opzionali** | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | Due `compileTextSource` in piu' (`:441`); un valutatore di scrivibilita' sul modello di `editsName` (`:308-310`) | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | `applyEdgeStyle` (`:53-65`): due testi in piu' + revisione di `irLabelAlwaysVisible` (`:64`) | sempre |
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | Sezione Label (`:596-620`) da 1 a 3 `TextSourceEditor` + toggle di editabilita' per label | sempre |
| `frontend/src/components/editor-v2/utils/edgeUtils.ts` | Eventuale export di un'ancora di estremo (riuso/generalizzazione di `computeCardinalityAnchor` `:879-896`) — **fuori critical zone** | probabile |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Risoluzione objectId→vertexId per la scrittura (helper gia' presente `:142-151`) | Q5(a) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | **NESSUNA** con Q5(a). **Nuovo export** con Q5(b) ⇒ **critical zone + Layer Impact Report** | Q5(b) |
| `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | Estensione: compile delle due label nuove, drop-key, predicato di scrivibilita', round-trip | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | **NESSUNA** — superficie vertici, nessun import incrociato | mai |

### E-route — manhattan / direct / bezier

| File | Intervento previsto | Condizionato a |
|---|---|---|
| `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx` | **Principale e quasi unico**: scelta del path in base al routing risolto (`:173-176`); gate su `applyWaypoints` (`:180-183`), `applyBundleSpread` (`:204-208`), `registerEdgePath` (`:215-219`), crossings/`buildFinalPath` (`:227-272`), `SegmentHandles` (`:735-742`); ancora della label alternativa per i path non-polilinea | sempre |
| `frontend/src/components/editor-v2/utils/edgeUtils.ts` | Eventuale ancora di label non basata su `parsePathPoints` (rischio 2); nessun tocco a `computeManhattanPath` — **fuori critical zone** | probabile |
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | Vocabolario di `edge.routing` (`:206`) | Q9 |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` | `irRoutingHint` (`:56`) da dead write a dato consumato | sempre |
| `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` | Nuova Select "Routing" nella sezione Linea | sempre |
| `frontend/src/components/editor-v2/viewpoint/ir/irEdgeInteraction.ts` | Eventuale coerenza dei waypoint al cambio routing (OQ-16) — **fuori critical zone** | Q10 |
| `frontend/src/components/editor-v2/utils/portDistribution.ts` | **NESSUNA** (OQ-15) — a meno che non si voglia ancoraggio per-edge ⇒ **critical zone + Layer Impact Report** | Q10(c)/ancoraggio |
| `useJjomSync.ts`, `canvasToJjom.ts`, `syncState.ts` | **NESSUNA** | mai |

---

## Costo relativo delle tre slice

| | **E-mark** | **E-lab** | **E-route** |
|---|---|---|---|
| **Ordine di grandezza** | **Media**, ma **molto piu' bassa di quanto sembri**: il registro (17 glifi, zampe di gallina incluse), il tipo `MarkerPreset`, l'editor custom completo (preset + canvas draggabile + Monaco + live preview) **esistono gia'** e sono inutilizzati dall'IR. Il lavoro nuovo si riduce a: riscrivere il blocco `<defs>` (`:645-706`), aprire un tipo che nessuno matcha esaustivamente (OQ-6), e sostituire due Select. **~5 file** | **Media**. Additiva pura sullo schema (OQ-10), geometria degli estremi gia' disponibile a costo ~zero (OQ-9), affordance di edit gia' isolata dal fix `c9b961343` e interamente conservata (OQ-11). Il costo reale non e' la label: e' **la semantica della scrittura** (Q5/Q6/Q7), che non e' un problema di codice ma di ratifica. **~6-7 file** | **Alta, ed e' la piu' cara delle tre** — ma **non per il motivo che si temeva**. Cambiare la forma del path e' quasi gratis (RF espone gia' gli helper, gli handle si riusano, OQ-15). Cara e' la **pipeline a valle**: sei consumatori assumono una polilinea ortogonale, e uno di essi (`registerEdgePath`) e' un registry globale condiviso con gli edge classici. **~4 file, ma uno di essi profondamente** |
| **Additiva o invasiva?** | **Additiva sullo schema**, **invasiva su un blocco** (`<defs>`, che va cambiato di forma, non esteso). Zero regressione sui marker classici: famiglie fisicamente distinte (OQ-4), a patto di non toccare `EditorV2.scss:2082-2111` | **Additiva** su schema, compile e validate. Invasiva sul solo `UnifiedEdge` (portale label + gate di editabilita'). Nessuna riscrittura di codice verificato | **Invasiva.** Non aggiunge un ramo: introduce un **regime alternativo** che invalida assunzioni distribuite in `UnifiedEdge` e in `edgeUtils`, con effetti fuori dal proprio edge (rischio 3) |
| **Perimetro fuori dalla critical zone?** | **Si', integralmente.** Nessun file di §3.1 | **Si' con Q5(a)** (riuso invariato dei writer canonici, risoluzione fatta fuori). **No con Q5(b)** ⇒ Layer Impact Report | **Si'** (verificato: gli handle si riusano, il router e' disaccoppiato dall'assegnazione). **No** solo se si aggiunge liberta' di ancoraggio per-edge ⇒ `portDistribution.ts` ⇒ Layer Impact Report |
| **Sorpresa principale** | **In positivo**: `markerPresets.ts` + `EdgeMarkerEditorModal.tsx` — ~750 righe di lavoro gia' fatto, incluse le zampe di gallina ER, mai collegate all'IR | **Neutra**: `edge.labels.placement` e' un dead write, non una feature da attivare. E la label di una reference-as-edge non ha un bersaglio proprio | **In positivo sul rischio, in negativo sul lavoro**: la critical zone non entra (era il timore), ma la pipeline ortogonale e' piu' pervasiva del previsto |

**Indicazione che questa discovery puo' dare senza decidere**: la piu' economica rispetto alla percezione e' **E-mark** (il substrato esiste gia'); la piu' cara e' **E-route**, e non per il rischio di critical zone — che si e' rivelato assente — ma per il numero di assunzioni ortogonali che vanno gatate una per una. **E-lab e' la piu' incerta**, non perche' costosa in codice ma perche' il suo costo dipende quasi interamente da tre ratifiche (Q5, Q6, Q7), una delle quali (Q5) e' anche l'unica decisione dell'arco che puo' portare una slice dentro la critical zone.

---

## Riferimenti

- Discovery precedenti: `docs/discovery/discovery_2026-08-02_eobj_object_as_edge_authoring.md` (E-obj, con la tabella di correzione anchor a `b65bfe78f`), `discovery_2026-07-26_edge_authoring_substrate.md` (substrato, **la cui tabella "DEAD WRITE" e' superata da E0** — vedi §Correzioni), `discovery_2026-08-02_edge_label_editability.md` (stato pre-fix dell'affordance di edit, D1..D4).
- Commit rilevanti: `c9b961343` (HEAD, disattivazione dell'edit inline sulle label IR), `d1dc55649` (E-obj, authoring object-as-edge), `9bd8cad9a` (E-ref, pannello edge).
- Siti chiave verificati a HEAD: `UnifiedEdge.tsx:97-113` (gate IR + `labelEditable`), `:153-154` (lati dagli handle), `:173-176` (router), `:264-272` (path finale), `:279-301` (ancore label/cardinalita'), `:317-337` (`commitLabel`), `:356-382` (id marker + `irMarkerUrl`), `:523-549` (scelta marker + stili inline), `:566-575` (visibilita' + gate del portale), `:579-707` (defs), `:758-787` (label centrale); `edgeUtils.ts:26-31` (`getSideFromHandle`), `:92-135` (`computeManhattanPath`), `:799-833` (`computeLabelPosition`), `:879-896` (`computeCardinalityAnchor`), `:941-973` (`applyWaypoints`), `:1300-1443` (registry + crossings); `handlePosition.ts:183-251` (`computeSidePositions`); `portDistribution.ts:71-266` (**critical zone, sola lettura**); `irTypes.ts:169-175` (`EdgeTermination`), `:187-215` (`EdgeViewIR`), `:260-281` (`CompiledEdgeView`), `:345-353` (`CompiledLabel`/`editsName`); `irCompile.ts:47-74` (`parsePathExpr`), `:308-310` (`editsName`), `:380-400` (`compileTextSource`), `:404-450` (`compileEdgeView`); `irEdgeViews.ts:35-67` (`applyEdgeStyle`), `:88-111` (`assignGeometricHandles`), `:114-139`, `:164-255`; `irResolveCore.ts:116-143`, `:256-320`; `irValidate.ts:16-25`; `EdgeAuthoringPanel.tsx:78-81` (`isUsableEndpointExpr`), `:162-176` (scrittura atomica dei capi), `:578-594` (terminazioni), `:596-620` (label); `EditorV2.tsx:142-151`, `:159-173`, `:1026-1099`, `:1341-1364`, `:1858-1897`, `:3366-3392`; `canvasToJjom.ts:105-116`, `:533`, `:798-844`, `:1400-1426` (**critical zone, sola lettura**); `markerPresets.ts:6-18`, `:23-207`, `:212-238`; `EdgeMarkerEditorModal.tsx:185-188`, `:298-319`, `:402-451`; `Select.tsx:84-101`; `JjSelect.tsx:160-180`; `EditorV2.scss:2082-2111`, `:2179-2229`.
