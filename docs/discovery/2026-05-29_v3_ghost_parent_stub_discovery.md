# Discovery — v3 ghost-parent stub per ereditarietà cross-metamodello (Fase 1, READ-ONLY)

**Nome documento prompt**: 2026-05-29 — discovery_v3_ghost_parent_stub
**Branch**: `alfonso-frontend-jjtl`
**Modalità**: sola lettura. Nessun file sorgente modificato. Tutte le citazioni `file:riga` sono state verificate direttamente sul working tree.

## Sintesi esecutiva

Il task è **fuori dalla critical-zone**: per renderizzare lo stub-fantasma + arco come overlay interno al nodo `B` non occorre toccare `useJjomSync.ts`, `portDistribution.ts`, il sistema di handle/anchor né creare nodi/edge ReactFlow reali. Il nodo classe (`ClassNode`) ha già un wrapper con `overflow` **visibile** e nel codice esiste già un precedente di contenuto che sporge sopra il box (`.node-problem-dot`).

Tre punti di attenzione, tutti documentati sotto in "Aperto / Da decidere":
1. **Bridge dati** — `ClassNode` riceve solo `{ id, data, selected }`; `data` **non** trasporta l'id dell'elemento di modello né la lista dei parent. La lista dei genitori cross-metamodello va o calcolata a transform-time (in `jjomTransformers.ts`, dove `lClass = vertex.model` è già in scope) e iniettata in `data`, oppure risolta live a render-time da `node.id` (= id del `DVertex`).
2. **Z-index a runtime** — `@xyflow/react` assegna lo z-order dei nodi via JS; se lo stub sporge sopra un nodo adiacente, l'ordinamento **va verificato a runtime** (la sola ispezione SCSS non basta).
3. **Token cyan** — il design parla di "accent cyan `#0ea5e9`", ma il token reale del canvas è `--color-canvas-accent: #06b6d4` (cyan-500). `#0ea5e9` esiste solo come token della toolbar. Usare il token, non il literal.

---

## D1 — Componente del nodo classe nel v2-flow

**Componente**: `ClassNode` (default export).
**Path**: `frontend/src/components/editor-v2/nodes/ClassNode.tsx`.
**Firma**: `function ClassNode({ id, data, selected }: NodeProps<ClassNodeType>)` — `ClassNode.tsx:24`, con `export type ClassNodeType = Node<ClassNodeData, 'classNode'>` (`ClassNode.tsx:19`).

**Registrazione come `nodeType`** — `EditorV2.tsx:93-98`:
```typescript
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
    objectNode: ObjectNode,         // M1: instance of a metaclass
};
```
Passato a `<ReactFlow nodeTypes={nodeTypes} ... />` (EditorV2.tsx, intorno a riga 3047). Il nodeType id è la stringa `'classNode'`.

**Come riceve i dati del modello**: solo via `data: ClassNodeData`. La forma (`types.ts:64-73`):
```typescript
export interface ClassNodeData {
    label: string;            // nome classe (es. "B")
    isAbstract: boolean;
    isSingleton?: boolean;
    attributes: MetaAttribute[];
    references?: MetaReference[];
    operations?: MetaOperation[];
    jsxString?: string;
    [key: string]: unknown;
}
```
> **NB (load-bearing per l'implementazione)**: `data` **non** contiene l'id dell'elemento di modello né la lista `extends`. Il `data` è puramente di presentazione.

**Bridge nodo → modello**: l'`id` del nodo ReactFlow è l'id del **`DVertex`** (NON del `DClass`). Costruito in `jjomTransformers.ts` → `classVertexToRFNode`:
```typescript
return {
    id: vertex.id,                        // jjomTransformers.ts:116  → id del DVertex
    type: 'classNode',
    position: { x, y },
    data: {
        label: lClass?.name ?? 'Class',   // :120  lClass = vertex.model
        isAbstract: !!lClass?.abstract,
        ...
    },
};
```
Quindi `lClass = vertex.model` è la classe (LClass), e nel transformer è già **in scope**. Due strade per leggere i parent (vedi D3/Aperto):
- **(A) transform-time**: in `classVertexToRFNode` leggere `lClass.extends`, filtrare i cross-metamodello e iniettare un `data.ghostParents`. ClassNode renderizza da `data`. _Raccomandato_ (ClassNode resta "dumb", nessun accesso proxy in render).
- **(B) render-time**: da `node.id` (= vertex id) risolvere `LPointerTargetable.fromD(id) → .model (LClass) → .extends`.

**Struttura JSX e classi SCSS** (`ClassNode.tsx:246-367`):
```jsx
<div className={`mm-node mm-class ${selected ? 'selected' : ''} ...`}>   // :247-252
    <NodeResizer ... />                                                  // :253
    <DynamicHandles nodeId={id} />                                       // :261
    <div className="mm-node__header" ...>                                // :264
        <span className="mm-node__name">{name}</span>                    // :280
    </div>
    <div className="mm-node__body">                                      // :294
        <div className="mm-node__fields">                                // :297
            <div className="mm-field" ...>                               // :301
                <span className="mm-field__name">...</span>
                <span className="mm-field__separator">:</span>
                <span className="mm-field__type">...</span>
                <span className="mm-field__bound">...</span>
            </div>
        </div>
    </div>
</div>
```
SCSS: `.mm-node` (`EditorV2.scss:1179`), `.mm-class` (`EditorV2.scss:1357`), `.mm-node__header`/`__name`/`__body`/`__fields`, `.mm-field*`.
**Punto di innesto naturale dell'overlay**: come fratello di `<DynamicHandles nodeId={id} />` dentro il `<div className="mm-node mm-class ...">`, in coordinate locali al nodo (segue pan/zoom automaticamente come gli handle).

---

## D2 — Overflow sopra il box del nodo

**Overflow del wrapper `.mm-node`**: **visibile**. La regola `overflow: hidden` è **commentata** — `EditorV2.scss:1186`:
```scss
.mm-node {
    background: var(--node-bg);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    min-width: 140px;
    min-height: 40px;
    // overflow: hidden;          ← commentata → overflow visibile
    ...
}
```
Inoltre la variante `.mm-node.viewpoint-wrapper` imposta esplicitamente `overflow: visible` (`EditorV2.scss:1208`). ⇒ Uno stub disegnato sopra il box **non viene tagliato** dal wrapper del nodo custom.

**Precedente di contenuto che sporge dal box** — `.node-problem-dot` (`frontend/src/components/editor-v2/problems/NodeProblemIndicator.scss:1-13`):
```scss
.node-problem-dot {
    position: absolute;
    top: -6px;            ← sporge 6px SOPRA il bordo superiore
    right: -6px;          ← sporge 6px a DESTRA
    width: 12px; height: 12px;
    border-radius: 50%;
    z-index: 3;
    box-shadow: 0 0 0 2px white, 0 1px 3px rgba(15, 23, 42, 0.25);
    &::before { /* aura pulsante che scala 3× oltre il dot */ }
}
```
Renderizzato come `<button className="node-problem-dot ...">` (NodeProblemIndicator.tsx). È esattamente il pattern da rispecchiare: elemento `position: absolute` figlio del nodo, che protrude oltre il box.

**Z-index — quadro statico** (nessuna regola esplicita su `.react-flow__node` nell'SCSS di editor-v2; lo z-order dei nodi lo gestisce `@xyflow/react` in JS):

| Elemento | z-index | File:riga |
|---|---|---|
| `.node-problem-dot` | 3 | NodeProblemIndicator.scss:11 |
| handle / endpoint | 9–11 | EditorV2.scss:~2099–2122 |
| `.inline-type-select__list` | 100 | EditorV2.scss:~1713 |
| `.context-menu` | 1000 | EditorV2.scss:~3413 |
| `packageNode` (sfondo) | -1 | jjomTransformers.ts:182 (`style.zIndex: -1`) |

> **DA VERIFICARE A RUNTIME (flag esplicito)**: se lo stub sporge sopra `B` e sopra `B` c'è un altro nodo `A`, **chi sta davanti non è deducibile dall'SCSS statico**. `@xyflow/react` assegna z-index ai `.react-flow__node` dinamicamente (ordine DOM, selezione, drag, ed eventuale `style.zIndex` del nodo). Se serve garantire che lo stub stia davanti ai vicini, l'implementazione potrebbe dover impostare `style.zIndex` sul nodo host (come fa `packageNode` con `-1`) — decisione da prendere **dopo** verifica a runtime.

---

## D3 — Lettura dei genitori cross-metamodello

**Lista dei genitori (`extends`)**: getter `get_extends` su `LClass` — `LModelElement.tsx:3323-3327`:
```typescript
protected get_extends(context: Context): this["extends"] {
    return context.data.extends.map((pointer) => {
        return LPointerTargetable.from(pointer)
    });
}
```
Dichiarazione: `extends!: LClass[];` (`LModelElement.tsx:2725`). Restituisce `LClass[]` già risolti (pointer→oggetto): si usa direttamente `lclass.extends`, niente accesso a `.__raw`.

**Filtro "metamodello diverso"** — il pannello Extends fa già esattamente questo. Le opzioni provengono da `lclass.validTargetOptions` → `get_validTargets` (`LModelElement.tsx:2813-2832`). La riga discriminante è la **2819**:
```typescript
let m2: LModel = lclass.model;
let extendsarr = lclass.extendsChain.map(l=>l.id);
let pkgs = dclass.allowCrossReference ? m2.allCrossSubPackages : m2.allSubPackages;   // :2819
```
- `allowCrossReference` (toggle "Allow cross-extend") decide se includere i package dei metamodelli dipendenti.
- `m2.allCrossSubPackages` vs `m2.allSubPackages` (getter `LModelElement.tsx:~5451-5519`; la versione cross attinge a `c.data.dependencies` / `allDepPtrs`).

**Determinare a runtime se un parent è in un altro metamodello**: confrontare l'id del modello.
- getter `model` — `LModelElement.tsx:6013-6016`:
```typescript
protected get_model(context: Context): LModelElement["model"] {
    let l: LValue | LObject | LModel = context.proxyObject;
    while (l && l.className !== DModel.cname) l = l.father;   // risale la catena father
    return l as LModel; }
```
- Pattern: `parent.model.id !== B.model.id` ⇒ parent in metamodello diverso.

**Nome classe / nome metamodello / breadcrumb**:
- nome parent: `parent.name`; metamodello parent: `parent.model` (LModel), nome `parent.model.name`.
- path "package-style" (label dei gruppi nel pannello): `p.fullname` — `LModelElement.tsx:2824`, con `get_fullname` (`LModelElement.tsx:411-416`) che concatena i nomi dei `containers` con `.`.
- Stato corrente nel pannello (parent già selezionati): `extendValue = lclass.extends.map(c=>({value:c.id, label:c.name}))` (`Info.tsx:373`); opzioni: `extendOptions = lclass.validTargetOptions` (`Info.tsx:374`).

**Pannello UI Inheritance/Extends** — `Info.tsx:121-137`:
```jsx
{advanced && hasDependencies && <>
    <div className="jj-field-label">Extends</div>
    <MultiSelect ... options={extendOptions} value={extendValue}
        onChange={(v) => { lclass.extends = v.map(e => e.value); }} />
    <div className="jj-field-hint">Inherit from classes in dependent metamodels</div>   // :130
</>}
<PropertiesToggle data={lclass} field={'allowCrossReference'} label="Allow cross-extend" />  // :135
```
> Il blocco Extends compare solo con `advanced && hasDependencies` (`Info.tsx:121`).

**Insidie note (rispettate)**:
- Per **display/breadcrumb** va benissimo il L-getter (`parent.model.name`, `parent.fullname`). L'avvertimento `__raw.uri` vs L-getter (§3.7 CLAUDE.md) riguarda l'nsURI byte-identico per l'export Ecore: **non** pertinente qui (non esportiamo, mostriamo nomi).
- `extends` è risolto in modo sicuro dal getter (nessun rischio di pointer grezzi).
- Forward-link collections stale (§3.6): leggere `extends` su una classe **già montata** nel canvas è post-mount ⇒ ok. Il rischio resta solo se l'overlay deve reagire a stato appena-parsato (vedi "Aperto", reattività).

---

## D4 — Azione di navigazione esistente

**Primitiva "seleziona questo elemento"**: `SetRootFieldAction.new('_lastSelected', { node, view, modelElement })`. Usata dal click sul breadcrumb del pannello Properties — `Info.tsx:1253-1260`:
```typescript
const handleBreadcrumbClick = (elementId?: string) => {
    if (!elementId) return;
    SetRootFieldAction.new('_lastSelected' as any, {
        node: '', view: '', modelElement: elementId,
    });
};
```
Wiring nel JSX: `onClick={!isCurrent ? () => handleBreadcrumbClick(part.elementId) : undefined}` (`Info.tsx:1278`).

**Aprire un tab metamodello/modello**: `DockManager.open2(lModel)` (`DockManager.tsx:105-113`) — apre il tab e dispatcha `JjodelEvents.EDITOR_TYPE_CHANGE`.

**Pattern composito "apri + seleziona" già esistente**: `DockManager.openViewpoint` (`DockManager.tsx:186-230`):
```typescript
const applySelection = () => {
    SetRootFieldAction.new('_lastSelected' as any, { node: '', view: vp.id, modelElement: '' });
};
const currentEditorType = document.body.getAttribute('data-editor-type');
if (currentEditorType === 'metamodel' || currentEditorType === 'model') { applySelection(); return; }
...
DockManager.open2(firstMetamodel).then(() => { setTimeout(applySelection, 200); });   // delay per mount tab
```
> **Riuso per il click sullo stub ("vai al genitore nel suo metamodello")**: rispecchiare questa ricetta — `DockManager.open2(parentMetamodel)` poi `SetRootFieldAction.new('_lastSelected', { node:'', view:'', modelElement: parentClassId })`, con lo stesso `setTimeout(~200ms)` se il tab non era già aperto. **Nessuna nuova API di navigazione necessaria.**

**Nota**: il breadcrumb di `Info.tsx` (1237-1251) è costruito sulla catena di **contenimento** (`father`/`grandFather`), NON su un path cross-metamodello di `extends`. Non esiste quindi un breadcrumb "megamodel › metamodel › class" pronto per un *target* di `extends`: andrebbe composto da `parent.containers` / `parent.fullname` se servisse nel tooltip dello stub.

---

## D5 — Convenzione visiva esistente per "esterno / altro metamodello"

**Finding negativo (verificato via grep).** **Non** esiste alcun indicatore visivo per riferimenti cross-package/cross-metamodello: né nel tree a destra, né sugli edge del canvas, né come badge.
- L'export Ecore (`services/export/EcoreService.ts`) gestisce i puntatori cross-package solo a livello XML (commenti "cross-package-aware pointer"), **non** in UI.
- I badge del tree esistono (P/C/R/A, un badge `--new`) ma **nessuno** per "external/imported".
- L'unica occorrenza testuale "dependent" è l'hint del pannello Extends — `Info.tsx:130` (`"Inherit from classes in dependent metamodels"`).

⇒ Lo stub-fantasma **introduce una nuova convenzione visiva** (non c'è stile da riusare). L'accent del canvas più vicino da riusare è `--color-canvas-accent` (cyan) per il tratteggio. Per la testa di freccia di generalizzazione (triangolo vuoto UML), lo stile di riferimento è l'edge di ereditarietà gestito da `UnifiedEdge` (edgeType `inheritance`, vedi `EditorV2.tsx:101-104`), **ma** lo stub/arco del design sono un overlay in-node, **non** un edge reale: probabile soluzione più semplice un piccolo marker SVG triangolare inline.
> **DA VERIFICARE A RUNTIME**: se si vuole replicare esattamente la testa di freccia "triangolo vuoto" dell'ereditarietà, ispezionare il marker di `UnifiedEdge` a runtime.

---

## D6 — Design token reali

**Cyan (accent del canvas)** — `--color-canvas-accent: #06b6d4` (cyan-500), **non** `#0ea5e9`:
- `frontend/src/styles/tokens/_colors-light.scss:205` — `--color-canvas-accent: #06b6d4; /* Selection, focus, active (cyan-500) */`
- `frontend/src/styles/tokens/_colors-dark.scss:109` — `--color-canvas-accent: #06b6d4;`
- Varianti: `--color-canvas-accent-hover: #22d3ee` (light:206), `--color-canvas-accent-subtle: rgba(6,182,212,0.1)` (light:207), `--color-canvas-accent-muted: rgba(6,182,212,0.05)` (light:208).
- Già consumato da selezione/handle: `--color-node-border-selected` (217), `--color-edge-selected` (236), `--color-handle-border` (246), `--color-handle-hover` (248) puntano tutti a `--color-canvas-accent`.
- ⚠️ `#0ea5e9` esiste **solo** come `--color-toolbar-btn-active-text` (`_colors-light.scss:281`), token specifico della toolbar — **non** usarlo sul canvas. (Esiste anche `--color-badge-ref-text: #06b6d4` a `_colors-light.scss:321`.)

**Slate base** — `--color-accent: #334155` (slate-700) light / `#94a3b8` dark:
- `_colors-light.scss:118` — `--color-accent: #{$slate-700};`
- `_colors-dark.scss:47` — `--color-accent: #94a3b8;`
- Fill slate sottili: `--color-accent-subtle: rgba(51,65,85,0.06)` (light:124), `--color-accent-muted: rgba(51,65,85,0.12)` (light:123).
- Sfondo nodo dark: `--color-node-bg: #1e293b` (slate-800) (`_colors-dark.scss:119`).

**Raccomandazione**: tratteggio dello stub + arco in `var(--color-canvas-accent)`; eventuale fill tenue `var(--color-canvas-accent-subtle)`.
> Nota: sul canvas coesistono `--color-accent` (slate, es. bordo `.mm-node.selected` a `EditorV2.scss:1194`) e `--color-canvas-accent` (cyan). Poiché il design dice "accent cyan", il token corretto per lo stub è **`--color-canvas-accent`**.

---

## D7 — Naming (solo verifica collisioni — nulla creato)

Grep globale su `frontend/src/`: **tutti i candidati LIBERI** (0 hit):

| Candidato | Esito |
|---|---|
| `.ghost-parent-stub` | ✅ libero |
| `ghost-parent` | ✅ libero |
| `ghostParent` | ✅ libero |
| `ghost-stub` | ✅ libero |
| `phantom-parent` | ✅ libero |
| `.ghost*` (qualsiasi) | ✅ nessuna occorrenza |

**Registry eventi** (`frontend/src/events/registry.ts`): convenzione `jjodel:*` kebab-case, costanti tipizzate raggruppate (`JjodelEvents`, ecc.). Nessun evento `ghost`/`phantom`.

**Proposte (NON create)**:
- Classe SCSS: **`.ghost-parent-stub`** (con figli BEM `.ghost-parent-stub__box`, `.ghost-parent-stub__arc`).
- Data attr (se serve per click/navigazione): `data-ghost-parent-id`.
- Evento custom: **probabilmente non necessario** (l'overlay renderizza da `data`/proxy). Se servisse, registrare in `JjodelEvents` come `jjodel:ghost-parent-...` — **mai** stringa hardcoded (CLAUDE.md §8.6).

---

## Aperto / Da decidere in chat

1. **Bridge dati (A vs B)** — calcolo dei parent cross-metamodello a **transform-time** (`jjomTransformers.ts:classVertexToRFNode`, `lClass` già in scope → iniettare `data.ghostParents`) oppure **render-time** (risolvere da `node.id`). _Raccomandato A_: ClassNode resta dumb, nessun accesso proxy in render.
2. **Z-index a runtime** — verificare se lo stub che protrude sopra `B` si disegna davanti a un nodo adiacente sopra `B`. Possibile necessità di `style.zIndex` sul nodo host o di un portale. **Decisione post-verifica runtime.**
3. **Reattività su cambio `extends`** — se l'utente modifica i parent dal pannello Properties mentre il canvas è aperto, la trasformazione (e quindi `data.ghostParents`) si rigenera? Confermare che il path di refresh sync/transform si re-innesca al cambio di `extends` (analogo al gap M1 di §3.5). Rischio di propagazione da chiarire.
4. **Token cyan** — confermare l'uso di `var(--color-canvas-accent)` (#06b6d4) invece del literal `#0ea5e9` citato nel design.
5. **Solo un genitore esterno** (prima iterazione, da design) — confermare il rinvio del collasso "+N" e del multiplo.
6. **UX del click** — riuso di `DockManager.open2(parentMetamodel)` + `SetRootFieldAction _lastSelected`: confermare se aprire un nuovo tab del metamodello del genitore o solo selezionare se già aperto.
7. **Triangolo di generalizzazione** — riusare il marker dell'edge `inheritance` di `UnifiedEdge` o disegnare un piccolo SVG inline nell'overlay (non essendo un edge reale, l'SVG inline è probabilmente la via più semplice).
