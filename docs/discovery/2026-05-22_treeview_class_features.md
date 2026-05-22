# Discovery — Tree View: espandere le classi mostrando attributi e references

**Data**: 2026-05-22
**Tipo**: read-only
**Output**: questo report
**Autore**: Claude Code

---

## Sommario esecutivo

Il Tree View attivo è `TreeViewContent.tsx` (1804 righe). `ClassNode` (479-536) è oggi un **leaf** che usa `EntityRow` con `isLeaf` attivo: l'icona chevron non viene renderizzata e nessuna espansione è prevista. La prop `expandKey={cls.id}` è già impostata, ma viene oggi consumata **solo** per il lookup del `problemKey` (riga 350 in `EntityRow`), non per l'espansione.

La buona notizia: tutta l'infrastruttura tecnica necessaria all'estensione è **già presente**.
- `EntityRow` supporta `expandKey + expanded + onToggle + isLeaf=false`, identico al pattern di `PackageNode`.
- La persistenza espansione (`DProject.expandedTreeNodes` con prefisso `!` per i collapsed espliciti) è generica per stringhe arbitrarie, non specifica per package o section.
- Le CSS classes badge `tree-DAttribute` e `tree-DReference` **esistono già** in `tree-view-sidebar.scss` (light + dark mode) con colori prossimi al mockup (verde `#639922` per `A`, coral `#D85A30` per `R`).
- Il modello dati L-layer espone forward-link `lClass.attributes: LAttribute[]` e `lClass.references: LReference[]` in declaration order.
- `Info.tsx` (Property panel) gestisce già `DAttribute` e `DReference` come kind di primo livello tramite uno `switch (data.className)` con `builder.attribute()` / `builder.reference()` dedicati.

Tre divergenze e/o decisioni aperte sono emerse e richiedono input architetturale prima della Fase B: l'ordinamento delle features (interleaved vs grouped), la divergenza palette `entityMeta.ts` ↔ scss hardcoded, la scelta tra colonna inline `: EString [0..1]` come testo grigio o come `pillText` tramite il meccanismo esistente.

---

## 1. Architettura `ClassNode` corrente

**File**: `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`
**Range righe**: 479-536

### Stato attuale: leaf

```tsx
// righe 512-532
return (
    <div ref={nodeRef} className="tree-node" data-element-id={cls.id}>
        <EntityRow
            badge="C"
            badgeClassName="tree-DClass"
            name={cls.name}
            nameClassName={cls.isAbstract ? 'is-abstract' : undefined}
            isLeaf                                  // ← LEAF: chevron disabilitato
            extraIcon={cls.isEdgeView ? 'bezier2' : null}
            extraIconTitle={cls.isEdgeView ? 'View as edge' : undefined}
            tooltip={tooltip}
            selected={isSelected}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            depth={depth}
            dataElementId={cls.id}
            isHighlighted={isHighlighted}
            highlightAction={highlightedAction}
            showNewBadge={isHighlighted && highlightedAction === 'create'}
            expandKey={cls.id}                      // ← presente, ma usato SOLO per problemi
        />
        {popup}
    </div>
);
```

In `EntityRow` (riga 347): `const hasChevron = !!expandKey && !isLeaf;` → con `isLeaf=true`, niente chevron. La prop `expandKey` continua però a essere usata a riga 350 per costruire `problemKey` (problem indicator).

### Logica `expandKey` / `isExpanded`

`ClassNode` **non riceve oggi** `isExpanded` / `onToggle` né `isExpandedFn` / `onToggleFn`. Il pattern usato da `PackageNode` (540-632) e `ModelNode` (636-705) è il template di riferimento per l'estensione:

```tsx
// righe 605-616 (PackageNode → child PackageNode)
<PackageNode
    key={sub.id}
    pkg={sub}
    selectedId={selectedId}
    depth={depth + 1}
    isExpanded={isExpandedFn(sub.id)}
    onToggle={() => onToggleFn(sub.id)}
    isExpandedFn={isExpandedFn}
    onToggleFn={onToggleFn}
    ...
/>
```

### Punto di istanziazione

`ClassNode` è istanziato **solo** da `PackageNode`, riga 618-626:

```tsx
{pkg.classes.map(c => (
    <ClassNode
        key={c.id}
        cls={c}
        selectedId={selectedId}
        depth={depth + 1}
        highlightedElementId={highlightedElementId}
        highlightedAction={highlightedAction}
    />
))}
```

### Props ricevute oggi

```ts
// righe 480-491
{
    cls: TreeClassData;            // dati derivati, non LClass proxy
    selectedId?: string;
    depth: number;
    highlightedElementId?: string | null;
    highlightedAction?: ElementAction | null;
}
```

**Non riceve un `LClass`**, riceve un `TreeClassData` (interface a righe 97-104):

```ts
interface TreeClassData {
    id: string;
    name: string;
    fqn: string;
    isAbstract: boolean;
    isEdgeView: boolean;
    instanceCount: number;
}
```

Per accedere alle features della classe, la strada canonica (coerente col pattern `buildPackageData`) è **estendere `TreeClassData`** con le liste features pre-calcolate in `mapStateToProps`. Alternativa: passare l'`id` e risolvere `LClass.fromPointer(id)` dentro `ClassNode` — comporterebbe però una connessione Redux locale o un hook custom, fuori dal pattern attuale.

---

## 2. Modello dati: accesso a `attributes` e `references` della classe

**File**: `frontend/src/model/logicWrapper/LModelElement.tsx` (≈8000 righe, dove vivono D/L layer definitions).

### LClass — definizione (2693-2812)

Forward-link collections presenti in L-layer:

```ts
// righe 2720-2723
operations!: LOperation[];
features!: LStructuralFeature[];     // ← attributi + references in declaration order
references!: LReference[];           // ← solo references, declaration order
attributes!: LAttribute[];           // ← solo attributi, declaration order
```

Varianti pre-calcolate (utili se in futuro vorremo opzioni di vista):

```ts
// righe 2777-2790
ownAttributes!: LAttribute[];        // dichiarate sulla classe stessa
ownReferences!: LReference[];
inheritedAttributes!: LAttribute[];  // dalle superclassi
inheritedReferences!: LReference[];
allAttributes!: LAttribute[];        // own + inherited
allReferences!: LReference[];
```

### Getter implementation — ordine garantito

```ts
// righe 3216-3220 (LReference[])
protected get_references(context: Context): this["references"] {
    return context.data.references.map((pointer) => {
        return LPointerTargetable.from(pointer)
    }).filter(e=>!!e) as any;
}
```

Stesso pattern per `get_attributes` (3244-3247) e `get_features` (3189-3191). I tre array L sono il `.map` 1:1 dell'array D-layer (`context.data.{attributes|references|features}`), quindi **declaration order preservato**.

### DClass — definizione (2615-2686)

```ts
// righe 2642-2644
features: Pointer<DStructuralFeature, 0, 'N', LStructuralFeature> = [];
references: Pointer<DReference, 0, 'N', LReference> = [];
attributes: Pointer<DAttribute, 0, 'N', LAttribute> = [];
```

`features` è il **superset eterogeneo** (LAttribute + LReference + LOperation? — da verificare se include anche operations, secondo le sub-classi: probabilmente no, `LStructuralFeature` esclude `LOperation`).

### DAttribute / LAttribute (≈4092-4191)

DAttribute (4100-4108):
```ts
name!: string;
type!: Pointer<DClassifier, 1, 1, LClassifier>;
ordered: boolean = true;
unique: boolean = true;
lowerBound: number = 0;
upperBound: number = 1;
```

LAttribute (4170-4188):
```ts
name!: string;
type!: LClassifier;       // L-proxy del classifier; type.name = "EString" ecc.
lowerBound!: number;
upperBound!: number;
many!: boolean;           // derivato: upperBound !== 0 (semantica EMF da confermare)
required!: boolean;       // derivato: lowerBound > 0
```

### DReference / LReference (≈3734-3895)

DReference (3743-3750, 3769-3772):
```ts
name!: string;
type!: Pointer<DClass, 1, 1, LClass>;
ordered: boolean = true;
unique: boolean = true;
lowerBound: number = 0;
upperBound: number = 1;
composition: boolean = false;
aggregation: boolean = false;
container: boolean = false;
opposite?: Pointer<DReference>;
```

LReference (3813-3825, 3871-3876):
```ts
name!: string;
type!: LClass;            // L-proxy della classe target; type.name accessibile
lowerBound!: number;
upperBound!: number;
composition!: boolean;
aggregation!: boolean;
containment!: boolean;
container!: boolean;
```

### Convenzioni cardinalità

`upperBound === -1` è il marker EMF di "unbounded" (`*`). Conferma da `frontend/src/jjscript/executor/commands/eval.ts:317`:

```ts
multiValued: attr.upperBound === -1 || attr.upperBound === '*',
```

(Lo `'*'` come stringa è una compatibilità con altri formati di input — al runtime D-layer `upperBound` è sempre `number`.)

Per il rendering tipo `[0..1]`, `[0..*]`, `[1..1]`:
```
lower = attr.lowerBound;
upper = attr.upperBound === -1 ? '*' : String(attr.upperBound);
label = `[${lower}..${upper}]`;
```

### Accesso al tipo

- Attributo: `attr.type.name` → string (es. `"EString"`)
- Reference: `ref.type.name` → string (nome della classe target)

`attr.type` in L-layer è già il **proxy** (`LClassifier`/`LClass`), non un Pointer raw. Accesso diretto a `.name` funziona.

### Esempi reali di uso nel codebase (call-sites)

```ts
// frontend/src/jjscript/autocomplete/providers/metamodel.ts:118-130
for (const attr of cls.attributes) { ... }
for (const ref of cls.references) { ... }

// frontend/src/components/editor-v2/panels/PalettePanel.tsx:107-110
const containmentRefs = selectedMetaclass.references.filter(r => r.containment);

// frontend/src/components/editor-v2/utils/compositionCompat.ts:39-40
for (const ref of parentMetaclass.references) {
    if (!ref.containment) continue;
```

I forward-link `.attributes` / `.references` sono già **comunemente letti** nel codebase senza problemi di stale data, a conferma che fuori dalla finestra post-import sono affidabili.

---

## 3. `entityMeta.ts`: palette attribute/reference

**File**: `frontend/src/common/entityMeta.ts` (271 righe)

### Entry esistenti

Tutte già registrate (righe 60-202). Entry rilevanti:

| Chiave | letter | color (icon/fg) | badgeBg | badgeText |
|--------|--------|-----------------|---------|-----------|
| `metamodel` | `M` | `#534AB7` | `#EEEDFE` | `#534AB7` |
| `model` | `m` | `#f59e0b` | `#FAEEDA` | `#854F0B` |
| `transformation` | `T` | `#10b981` | `#E1F5EE` | `#0F6E56` |
| `viewpoint` | `V` | `#DB2777` | `#FCE7F3` | `#DB2777` |
| `package` | `P` | `#f59e0b` | `#DBEAFE` | `#2563EB` |
| `class` | `C` | `#0ea5e9` | `#FEE2E2` | `#DC2626` |
| `abstractClass` | `C` | `#0ea5e9` | `#FEE2E2` | `#DC2626` (italic) |
| `enum` | `E` | `#ec4899` | `#FEF3C7` | `#D97706` |
| `enumLiteral` | `L` | `#f472b6` | `#F3F4F6` | `#6B7280` |
| **`attribute`** | **`A`** | **`#10b981`** | **`#D1FAE5`** | **`#059669`** |
| **`reference`** | **`R`** | **`#8b5cf6`** | **`#CFFAFE`** | **`#0891C2`** |
| `operation` | `O` | `#06b6d4` | `#E0E7FF` | `#4F46E5` |
| `parameter` | `P` | `#9ca3af` | `#F1F5F9` | `#475569` |
| `object` | `O` | `#6b7280` | `#CCFBF1` | `#0D9488` |
| `dataType` | `D` | `#0ea5e9` | `#F1F5F9` | `#475569` |

**Le entry `attribute` e `reference` esistono già** (righe 148-165), con palette però **distinta** da quella in uso nelle CSS class `tree-DAttribute`/`tree-DReference` (vedi sezione 4). Questo è uno dei punti di decisione architetturale (vedi §10).

### Alias map (righe 206-232)

```ts
'DAttribute': 'attribute',
'DReference': 'reference',
// …
```

Quindi `resolveEntityType('DAttribute')` → `'attribute'`. Si può usare `entityIcon('attribute')`, `entityLetter('attribute')`, `entityColor('attribute')` se in futuro si vuole una palette unica.

### Convenzione naming chiave

Le chiavi in `EntityType` sono **camelCase** (`abstractClass`, `enumLiteral`, `dataType`). L'alias D-prefixed (`DAttribute`) viene mappato sulla forma canonica camelCase. Per coerenza, qualsiasi nuova entry futura va in camelCase.

---

## 4. Token colori esistenti per attribute/reference

### `_colors-light.scss` (357 righe)

Block `ENTITY CATEGORICAL PALETTE` (righe 327-347):

```scss
--color-entity-metamodel-bg: #EEEDFE;
--color-entity-metamodel-fg: #534AB7;
--color-entity-package-bg: #DBEAFE;
--color-entity-package-fg: #2563EB;
--color-entity-class-bg: #FEE2E2;
--color-entity-class-fg: #DC2626;
--color-entity-model-bg: #FAEEDA;
--color-entity-model-fg: #854F0B;
--color-entity-viewpoint-bg: #FCE7F3;
--color-entity-viewpoint-fg: #DB2777;
```

**Non esistono** token `--color-entity-attribute-{bg,fg}` né `--color-entity-reference-{bg,fg}`.

### `_colors-dark.scss` (256 righe)

Block `ENTITY CATEGORICAL PALETTE — dark variant` (righe 231-244):

Stessi 10 token (metamodel/package/class/model/viewpoint × bg/fg). **Niente attribute/reference**.

### Dove vivono ALLORA i colori attribute/reference

Hardcoded direttamente in `tree-view-sidebar.scss`:

```scss
// righe 532-540 (light mode, dentro .tree-node__icon)
&.tree-DAttribute {
    color: #639922;                             // verde-oliva scuro
    background: rgba(99, 153, 34, 0.12);
}

&.tree-DReference {
    color: #D85A30;                             // coral/orange
    background: rgba(216, 90, 48, 0.12);
}
```

Dark mode override (righe 911-913):
```scss
.tree-node__icon {
    &.tree-DAttribute { background: transparent; color: #9AD04E; }
    &.tree-DReference { background: transparent; color: #F09474; }
    // …
}
```

**Divergenza significativa**: la palette **attiva** nel TreeView è verde-oliva `#639922` / coral `#D85A30`, mentre `entityMeta.ts` dichiara emerald `#10b981` / viola `#8b5cf6`. Non sono usati in fissi grandi; nessuno dei due viene impiegato (entityMeta dà i metadati a `ElementBadge`, le scss qui sopra dipingono i badge nel tree). È questione da chiarire prima di toccare l'estetica (vedi §10).

---

## 5. `EntityRow` e props

**File**: `TreeViewContent.tsx`
**Range righe**: 309-438
- Type `EntityBadge`: 311
- Interface `EntityRowProps`: 313-337
- Component `EntityRow`: 339-438

### Tutte le props oggi accettate

```ts
interface EntityRowProps {
    badge: EntityBadge;            // 'M' | 'P' | 'm' | 'C' | 'VP' | 'v'
    badgeClassName?: string;       // CSS class per il colore (es. 'tree-DModel')
    name: string;
    nameClassName?: string;        // 'is-abstract' per italic
    pillText?: string;             // es. 'M1' — chip pill sulla destra del nome
    expandKey?: string;            // chiave per persistenza espansione + problem lookup
    isLeaf?: boolean;              // se true, niente chevron (slot invisibile mantenuto)
    expanded?: boolean;
    onToggle?: () => void;
    extraIcon?: 'bezier2' | 'stack' | null;
    extraIconTitle?: string;
    tooltip?: ReactNode;
    selected?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    depth: number;
    dataElementId?: string;
    highlightAction?: ElementAction | null;
    isHighlighted?: boolean;
    showNewBadge?: boolean;
    actions?: ReactNode;           // hover-reveal slot (es. add/duplicate/delete buttons)
    nameOverride?: ReactNode;      // custom name renderer (per inline rename)
    activeIndicator?: 'viewpoint' | 'model' | null;  // pulsing dot
}
```

### Esiste già una prop per `: EString [0..1]`?

**Sì, parzialmente**: `pillText`. È stato pensato come pill (`M1`, `R/W`, ecc.) e renderizzato come chip a riga 396:

```tsx
{pillText && <span className="tree-pill">{pillText}</span>}
```

CSS (`tree-view-sidebar.scss:1712-1725`):
```scss
.tree-pill {
    padding: 0 6px;
    height: 16px;
    font-size: 10px;
    color: var(--color-text-secondary);
    background-color: var(--color-accent-subtle);
    border-radius: 3px;
    line-height: 1;
}
```

Per il mockup specificato (testo grigio `: EString [0..1]` SENZA pill background), **`pillText` da solo non è ideale**: ha già padding, background e border-radius da pill. Tre opzioni per decidere in §10:
- **A.** Estendere `EntityRow` con una nuova prop `subText?: string` per testo grigio inline (no pill).
- **B.** Usare `pillText` ma con una CSS class modifier (`.tree-pill--plain`) che azzera background e padding.
- **C.** Riusare il pattern di `FeatureRow` (`.tree-feature__type`, riga 1760), introducendo un componente separato per le righe feature.

### Struttura del render

```tsx
// righe 373-431
<div
    className={`tree-row ${selected ? 'tree-row--selected' : ''} ${highlightClass}`.trim()}
    style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}     // ← indentazione inline
    data-element-id={dataElementId}
    onContextMenu={onContextMenu}
>
    {hasChevron ? (
        <button className="tree-node__toggle" onClick={...}>
            <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} />
        </button>
    ) : (
        <span className="tree-node__toggle is-leaf" aria-hidden />   // ← slot invisibile (allineamento)
    )}
    <div className="tree-row__content" onClick={onClick}>
        <span className={`tree-node__icon ${badgeClassName || ''}`}>{badge}</span>
        {nameOverride !== undefined ? nameOverride :
            <span className={`tree-row__name ${nameClassName || ''}`}>{name || 'unnamed'}</span>}
        {pillText && <span className="tree-pill">{pillText}</span>}
        {/* extraIcon, problem icon, NEW badge */}
    </div>
    {actions && <span className="tree-row__actions">{actions}</span>}
    {activeIndicator && <span className={`tree-row__active-dot ...`} />}
</div>
```

Indentazione: `paddingLeft = depth * 12px` (`TREE_INDENT_STEP=12`, riga 45). Lo slot chevron è sempre presente, anche quando `isLeaf` (riga 388: `<span className="tree-node__toggle is-leaf" aria-hidden />`), per garantire allineamento visivo.

---

## 6. `FeatureRow` (potenziale già esistente)

**File**: `TreeViewContent.tsx`
**Range righe**: 442-475

```tsx
const FeatureRow = memo(function FeatureRow({
    instance,
    selected,
    onSelect,
    depth,
}: {
    instance: TreeFeatureData;     // M1 instance data, NON M2 feature
    selected: boolean;
    onSelect?: () => void;
    depth: number;
}): ReactElement {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '',
            view: '',
            modelElement: instance.id,
        }, '', false);
        window.dispatchEvent(new CustomEvent(JjodelEvents.SELECT_NODE, {
            detail: { nodeId: instance.id, modelId: instance.modelId },
        }));
        onSelect?.();
    }, [instance.id, instance.modelId, onSelect]);

    return (
        <div className="tree-row tree-row--feature" data-element-id={instance.id}
             style={{ paddingLeft: `${depth * TREE_INDENT_STEP}px` }}>
            <span className="tree-node__toggle is-leaf" aria-hidden />
            <div className={`tree-row__content ${selected ? 'tree-row__content--selected' : ''}`}
                 onClick={handleClick}>
                <span className="tree-feature__name">{instance.name}</span>
                <span className="tree-feature__type">: {instance.metaclassName}</span>
            </div>
        </div>
    );
});
```

### Per cosa è usato OGGI

Per le **istanze M1** (oggetti del modello) sotto un `ModelNode`. Usa `TreeFeatureData` (interface 80-85), che è:

```ts
interface TreeFeatureData {
    id: string;
    name: string;
    metaclassName: string;          // → renderizzato come `: metaclassName`
    modelId: string;
}
```

Quindi `FeatureRow` mostra `nomeIstanza : NomeClasse` per oggetti M1 di un modello attivo. **Non c'è badge** (`A`/`R`), non c'è icona — è una riga "minore" nel registro visivo (font-size 12px nome, 11px tipo, color text-tertiary).

### È riusabile per il caso M2 features?

**Solo parzialmente**: il pattern struttura/SCSS è perfetto (slot chevron invisibile, nome + tipo grigio), ma:

- Non ha lo **slot badge** (`A`/`R`) richiesto dal mockup.
- L'`onClick` è cablato sull'evento `SELECT_NODE` per istanze M1 (non rilevante per features M2: il Property panel si aggancia da solo via `_lastSelected.modelElement`).
- Il name `TreeFeatureData` è già occupato — andrà rinominato o si introduce un nuovo tipo (`TreeClassFeatureData` o simile).

Conviene **aggiungere un nuovo componente** parallelo (es. `ClassFeatureRow`) che riusa il CSS di `tree-feature__name` e `tree-feature__type` ma aggiunge il badge `tree-node__icon` con `tree-DAttribute`/`tree-DReference`. È più chiaro che mescolare M1 e M2 nello stesso componente.

---

## 7. Selezione + Property panel

### Selezione: action Redux

Pattern identico tra tutti i `*Node` del TreeView:

```ts
// ClassNode righe 496-503
const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    SetRootFieldAction.new('_lastSelected', {
        node: undefined,
        view: undefined,
        modelElement: cls.id,           // ← solo l'ID, non un proxy
    }, '', false);
}, [cls.id]);
```

Path: `state._lastSelected = { node, view, modelElement }`. Per le features di classe sarà lo stesso pattern con `modelElement: featureId`.

### Property panel

**File**: `frontend/src/components/editors/Info.tsx`

- `mapStateToProps` (righe 1352-1363) legge `state._lastSelected?.modelElement` e risolve `LModelElement.fromPointer(dataID)` → `data`.
- Switch su `data?.className` (righe 1188-1212):

```ts
switch (ddata?.className) {
    case 'DModel':       jsx = builder.model(data, advanced, useNewDesign); break;
    case 'DPackage':     jsx = builder.package(data, advanced, useNewDesign); break;
    case 'DClass':       jsx = builder.class(data, advanced, useNewDesign); break;
    case 'DEnumerator':  jsx = builder.enum(data, advanced, useNewDesign); break;
    case 'DAttribute':   jsx = builder.attribute(data, advanced, useNewDesign); break;   // ✓
    case 'DReference':   jsx = builder.reference(data, advanced, useNewDesign); break;   // ✓
    case 'DOperation':   jsx = builder.operation(data, advanced, useNewDesign); break;
    case 'DParameter':   jsx = builder.operation(data.father, advanced, useNewDesign); break;
    case 'DEnumLiteral': jsx = builder.literal(data, advanced, useNewDesign); break;
    case 'DObject':      jsx = builder.object(data, topics, advanced, mode); break;
    case 'DValue':       jsx = builder.value(data, topics, advanced, mode); break;
    default:             jsx = <Empty />; break;
}
```

### DAttribute / DReference gestiti dal Property panel

**Sì, entrambi.** Builder methods rilevanti:

```ts
// Info.tsx:451-460
static attribute(data: LModelElement, advanced: boolean, skipTitle: boolean = false) {
    return (<>
        {this.feature(data, advanced, true)}    // tipo + bounds shared
        {advanced && <CollapsibleSection title="FLAGS" defaultOpen={false}>
            <PropertiesToggle data={data} field={'isID'} label="ID" />
            <div className="jj-divider" />
            <PropertiesToggle data={data} field={'isIoT'} label="IoT" />
        </CollapsibleSection>}
    </>);
}

// Info.tsx:461-471
static reference(data: LModelElement, advanced: boolean, skipTitle: boolean = false) {
    return (<>
        {this.feature(data, advanced, true)}
        <CollapsibleSection title="FLAGS">
            <PropertiesToggle data={data} field={'composition'} label="Composition" />
            <div className="jj-divider" />
            <PropertiesToggle data={data} field={'aggregation'} label="Aggregation" />
        </CollapsibleSection>
    </>);
}
```

Entrambi delegano a `feature()` (righe 405-449) per la parte comune (TYPE & BOUNDS), poi aggiungono FLAGS specifici. **Nessuna modifica necessaria a Info.tsx**: cliccando una feature nel tree, il Property panel renderizza automaticamente i suoi attributi/flag.

### `PropertiesWithTreeView` wrapper

**File**: `frontend/src/components/editors/PropertiesWithTreeView.tsx` (316 righe)

- Split layout: Properties panel (fluido, sinistra) + Tree View (260px default, resizable 200-500px, destra).
- Toggle indipendenti tra Properties e Tree (state locale + localStorage).
- Auto-collapse Tree quando un view è selezionato (riga 130-139), via transition-based useEffect.
- Listener su `JjodelEvents.TOGGLE_TREE_VIEW` (167-176) per shortcut esterno.
- Emette `PROPERTIES_TREE_RAIL_ONLY_ENTER/EXIT` quando entrambi i pannelli sono in rail collapse (160-165).

`Info` (Property panel) è renderizzato direttamente nel body (riga 213): `<Info mode={mode} />`. Si connette a `_lastSelected` via il proprio `mapStateToProps` (cfr §7), quindi **nessun cablaggio esplicito** tra Tree e Properties.

---

## 8. Persistenza espansione

### Pattern `DProject.expandedTreeNodes`

**Conferma**: l'array `expandedTreeNodes: string[]` su `DProject` è il single source of truth per l'espansione persistita. Lo schema usa il **collapsed marker** `!` per distinguere i collapsed espliciti dagli unseen:

```ts
// TreeViewContent.tsx:178
const COLLAPSED_PREFIX = '!';

// righe 180-187
function isExpandedFromArray(arr, key) {
    if (arr.indexOf(COLLAPSED_PREFIX + key) !== -1) return false;  // ! presente → collapsed
    if (arr.indexOf(key) !== -1) return true;                      // key presente → expanded
    return true;                                                   // assente → fallback expanded
}

function toggleInArray(arr, key, expand) {
    const collapsedMarker = COLLAPSED_PREFIX + key;
    const next = arr.filter(s => s !== key && s !== collapsedMarker);
    if (expand) next.push(key);
    else next.push(collapsedMarker);
    return next;
}
```

`isExpandedFn` / `onToggleFn` sono memoizzati nel `TreeViewContentComponent` (1287-1297). Sono già passati ricorsivamente a `PackageNode` e accessibili a `ClassNode` con minimo refactor (aggiungere le 2 props alla signature di `ClassNode`).

### Convenzione `expandKey` per le classi

Oggi le classi usano direttamente l'**ID raw** come `expandKey` (riga 531: `expandKey={cls.id}`), senza prefisso `class:`. Stesso pattern per `PackageNode` (588: `expandKey={pkg.id}`), `ModelNode` (679: `expandKey={model.id}`), `MetamodelNode` (analogo). I `__section:` prefix sono riservati alle sezioni sintetiche, non alle entità reali.

**Suggerimento (non da implementare qui)**: per le features mantengo la stessa convenzione (chiave = ID raw della feature, es. `DAttribute.id`). Cleanup automatico in `TreeViewContentComponent` (righe 1303-1341) filtra già le chiavi orfane confrontando con i valid IDs raccolti — basterà aggiungere le feature IDs al set `validIds` per evitare drift dopo eliminazioni.

---

## 9. D/L layer e forward-link freshness

### Stale-after-parse risk

Memoria progetto (CLAUDE.md §3.6): `pkg.classes`, `cls.attributes`, ecc. **possono essere stale** immediatamente dopo `parse()` perché i reducer Redux mergano in batch.

### Nel nostro caso: rischio basso

L'espansione di una classe del TreeView avviene **dopo** che il modello è già caricato e stabile (NON durante import). Quindi `cls.attributes` e `cls.references` sono affidabili nello stesso modo in cui lo sono `pkg.classes` (già letto da `buildPackageData` riga 1578).

Inoltre, il TreeView è già un consumer **massivo** di forward-link: `pkg.subpackages`, `pkg.classes`, `mm.packages`, `m1.objects`. Se questi pattern soffrissero di stale-data nel TreeView, già oggi vedremmo classi mancanti dopo l'import; in pratica non succede (cleanup orphan IDs + re-render Dashboard tick — committed 2026-05-19, ProjectEditor).

### Pattern esistente per features in altre parti del TreeView

`FeatureRow` (442-475) legge `obj.instanceof` (un L-proxy resolution) dentro `mapStateToProps` (1670-1683) e popola `TreeFeatureData.metaclassName`. Stesso pattern applicabile per features di classe:

```ts
// pseudo-code, da implementare in Fase B (NON in questa discovery)
for (const attr of c.attributes || []) {
    classData.attributes.push({
        id: attr.id,
        name: attr.name,
        typeName: attr.type?.name || '?',
        lowerBound: attr.lowerBound,
        upperBound: attr.upperBound,
    });
}
```

Tutta la lettura si fa in `mapStateToProps`, dove la connessione Redux ricalcola al cambiare di `state.idlookup`. Re-render automatico.

---

## 10. Decisioni richieste prima dell'implementazione

### 10.1 Ordinamento delle features (interleaved vs grouped)

Il mockup mostra: per `SistemaLogistico` → 1 attributo + 6 references (gruppi separati, attribute prima). Per `Produttore` → 4 attributi + 1 reference (gruppi separati).

Due interpretazioni possibili:
- **A. Grouped**: prima tutti gli `attributes`, poi tutte le `references` (mockup-style). Implementazione: `lClass.attributes` poi `lClass.references`.
- **B. Declaration order strict**: ordine dichiarazione nel file `.ecore`, attributi e references interleaved. Implementazione: `lClass.features` (eterogeneo).

Il prompt dice "nell'ordine di dichiarazione" che è ambiguo: l'XMI Ecore di solito non interleava, ma JjOM ha sempre l'opzione `features` interleavata.

**Decisione richiesta**: confermare se la richiesta è (A) gruppato attribs prima + refs dopo, oppure (B) declaration order dal file sorgente.

### 10.2 Divergenza palette badge `A`/`R`

Due palette concorrenti:
- **entityMeta.ts** (148-165): attribute `#10b981` emerald, reference `#8b5cf6` violet — coerente col resto della palette `--color-entity-*`.
- **tree-view-sidebar.scss** (532-540): attribute `#639922` verde-oliva, reference `#D85A30` coral — colori storici del TreeView, già presenti come CSS class `tree-DAttribute`/`tree-DReference`.

Il mockup ha `A` verde e `R` rosso/coral — visivamente più vicino alle scss hardcoded che a entityMeta.

**Decisione richiesta**: scegliere fra:
- **A. Tenere status quo** (scss hardcoded, riusare le CSS class esistenti). Cambio minimo, palette coerente col mockup.
- **B. Unificare su entityMeta.ts** spostando i colori nei token `--color-entity-{attribute|reference}-{bg|fg}` di `_colors-light.scss` e `_colors-dark.scss` (entrambi, come da regola CLAUDE.md §7.2). Cambia leggermente l'aspetto del badge ma porta coerenza all'ecosistema colori.

### 10.3 Rendering del tipo + cardinalità (`: EString [0..1]`)

Mockup: testo grigio inline senza pill background.

Tre opzioni discusse in §5:
- **A. Nuovo `subText?: string` su `EntityRow`** + nuova CSS class `.tree-row__subtext`. Generico per usi futuri.
- **B. Riusare `pillText` + modifier `.tree-pill--plain`** che azzera background. Più chirurgico ma "tortura" semantica della prop.
- **C. Nuovo componente `ClassFeatureRow`** (parallelo a `FeatureRow`) con badge + `tree-feature__name` + `tree-feature__type` riusati. Pattern visivamente coerente col `FeatureRow` esistente.

**Decisione richiesta**: in mancanza di altre indicazioni, la mia raccomandazione tecnica è **C** — componente dedicato, pattern visivamente coerente col `FeatureRow` esistente (stessa famiglia tipografica per features minori), zero impatto sull'API di `EntityRow`. Confermare o sostituire.

### 10.4 Tooltip per le feature row

Le righe di classe e package nel TreeView hanno tooltip (fqn + instanceCount/classCount). Le `FeatureRow` M1 attualmente **non** hanno tooltip. Per le M2 features:
- **A. Senza tooltip** (coerente con FeatureRow M1).
- **B. Con tooltip che mostra es. `Package.Class.attrName : Type [0..*]` + descrizione se presente.**

**Decisione richiesta**: confermare se serve tooltip su feature row M2.

### 10.5 Right-click sulle feature row

`ClassNode` usa `useClassifierContextMenu` per il context menu "Add View to Workbench" (riga 494). Le feature row dovrebbero avere context menu? Casi d'uso pensabili: "Add to view", "Delete attribute", "Rename".

**Decisione richiesta**: questa fase introduce solo selezione + visualizzazione, o anche context menu? Se sì, quali voci?

### 10.6 includes `ownAttributes` vs `allAttributes`

`lClass.attributes` = `ownAttributes` (dichiarati sulla classe stessa) o include anche `inheritedAttributes`?

Verifica diretta dal getter (`get_attributes`, riga 3244-3247): legge `context.data.attributes` raw, che sono solo quelli **dichiarati sulla classe**. Inherited NON inclusi.

**Decisione richiesta**: mostrare solo `attributes`/`references` (own), oppure `allAttributes`/`allReferences` (own + inherited)? Il mockup non distingue. Le references inherited (es. `Produttore.lotti` ereditato da una superclass) non sarebbero visibili se restiamo su `attributes` puro.

Domanda specifica: i modelli del mockup hanno superclassi? Se no, la decisione è teoricamente neutra ma va comunque codificata.

---

## 11. Rischi e mine

### 11.1 Crescita del payload `mapStateToProps`

Aggiungere `attributes` + `references` a `TreeClassData` aumenta la dimensione di `props.metamodels`. Per modelli grandi (centinaia di classi × decine di feature ciascuna) ciò produce un memoria extra di alcuni KB e ricalcoli più costosi quando `state.idlookup` cambia. Mitigazione: il calcolo già esistente di `instanceCount` (1585-1589) gira per tutte le classi senza segnali di lentezza; lo stesso pattern dovrebbe scalare. Comunque, **da osservare** in smoke test su un metamodello con >100 classi.

### 11.2 Selezione mantenuta dopo refresh

`_lastSelected.modelElement` punta a un ID stringa. Se l'utente seleziona una feature, riapre il progetto, e quella feature è stata rimossa, il Property panel rendererà `<Empty />` (default del switch). **Non un bug**, solo da verificare che il "selected" state nel tree non highlight una row inesistente.

### 11.3 Cleanup `expandedTreeNodes` orphani

Righe 1303-1341 in `TreeViewContent.tsx` puliscono gli ID orfani da `expandedTreeNodes` ad ogni cambio di `metamodels`/`standaloneModels`/`viewpoints`. Per non sovrappopolare il filtro (e per evitare loop di re-dispatch), la nuova logica per features dovrebbe **aggiungere le feature IDs al set `validIds`** durante la stessa visita. Altrimenti, espandere una classe persiste un ID che il successivo cleanup pass eliminerebbe.

```ts
// pseudo-fix da Fase B
const visit = (pkg: TreePackageData) => {
    validIds.add(pkg.id);
    for (const sub of pkg.subPackages) visit(sub);
    for (const c of pkg.classes) {
        validIds.add(c.id);
        for (const f of (c.attributes || [])) validIds.add(f.id);    // ← aggiunta
        for (const f of (c.references || [])) validIds.add(f.id);    // ← aggiunta
    }
};
```

Se questo step viene dimenticato, il sintomo è "ogni volta che il tree si re-renderizza, le features collassano". Test smoke: espandi una classe, clicca un nodo che triggera re-render (es. crea/elimina un nodo), riapri il tree → le feature dovrebbero restare espanse.

### 11.4 `entityMeta.ts` vs `tree-view-sidebar.scss` divergenza

Vedi §10.2. Se si decide per la opzione B (unificare su entityMeta + token CSS), va aggiornato **ogni** punto di consumo:
- `tree-view-sidebar.scss` righe 532-540 (light) e 911-913 (dark) → sostituire hex con `var(--color-entity-attribute-*)`
- `_colors-light.scss` e `_colors-dark.scss` → aggiungere i nuovi token (regola CLAUDE.md §7.2: entrambi i file, sempre)
- `entityMeta.ts` → palette già coerente, no-op

Se invece si tiene status quo (opzione A), no work CSS aggiuntivo.

### 11.5 `EntityRow.pillText` semantica

Se si introduce `subText?: string` come prop separata (opzione 10.3.A), assicurarsi che **non collida** con `pillText` né con `nameOverride` in altri call-site. `pillText` è oggi usato solo per `'M1'` su `MetamodelNode` (cercare con grep prima dell'implementazione).

### 11.6 LClass forward-link semantics (LClass extends LClassifier)

`LClass.attributes` dichiarato a riga 2723 — ma è il `get_attributes` di `LClass` a essere chiamato o quello ereditato? Cerca a riga 5510 c'è un altro `get_attributes` (forse su `LEnum`?). Questo punto **NON è un rischio nel caso medio** (le classi reali sono `LClass`, non `LEnum`/`LDataType`), ma può sorprendere se l'utente espande un `LEnum`. Verifica empirica: il TreeView oggi mostra `LClass` come `tree-DClass` ma `LEnum` come `tree-DEnumerator` (CSS distinto). I `ClassNode` ricevono solo `TreeClassData` da `mapStateToProps` (1578: `const cls = lPkg.classes || []`), quindi solo le classi proper sono renderizzate da `ClassNode`. Gli enum sono **assenti** dal tree attuale → non un problema per questa fase.

**Mina effettiva**: se la Fase B vorrà mostrare anche gli enum espandibili (literals), serve un altro componente. Fuori scope.

### 11.7 `useMemo` di `pkg.classes` reactivity

`buildPackageData` (1564-1617) è chiamato dentro `mapStateToProps` (1712). Se aggiungere `attributes`/`references` causa un re-build del `TreeClassData` ad ogni `_lastSelected` change, ci sarà un re-render eccessivo. Mitigazione: `mapStateToProps` ricalcola comunque per `state.idlookup` e `state._lastSelected`, e la struttura `metamodels` è una nuova array a ogni call. Il `connect` di react-redux fa shallow compare, quindi cambia tutto al cambio di selezione. Il re-render è **già presente oggi** — il rischio è solo di amplificarlo, non di crearlo. **Da osservare** ma non bloccante.

---

## Appendice — File mappa

| File | Path | Note |
|------|------|------|
| TreeViewContent.tsx | `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` | 1804 righe, hub principale |
| tree-view-sidebar.scss | `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` | badge styles, .tree-pill, .tree-feature__* |
| PropertiesWithTreeView.tsx | `frontend/src/components/editors/PropertiesWithTreeView.tsx` | wrapper Properties + Tree |
| properties-with-tree-view.scss | `frontend/src/components/editors/properties-with-tree-view.scss` | scss del wrapper |
| Info.tsx | `frontend/src/components/editors/Info.tsx` | Property panel — switch su `className` con `builder.attribute()` e `builder.reference()` già pronti |
| entityMeta.ts | `frontend/src/common/entityMeta.ts` | palette + icon per entity types; alias `DAttribute`→`attribute`, `DReference`→`reference` |
| _colors-light.scss | `frontend/src/styles/tokens/_colors-light.scss` | token CSS light — NO entity-attribute/reference oggi |
| _colors-dark.scss | `frontend/src/styles/tokens/_colors-dark.scss` | token CSS dark — NO entity-attribute/reference oggi |
| LModelElement.tsx | `frontend/src/model/logicWrapper/LModelElement.tsx` | LClass (2693+), LAttribute (4160+), LReference (3803+), DAttribute (4092+), DReference (3734+) |

---

**Esito**: discovery completata, nessun file di codice modificato. Tutte le 9 sezioni del prompt coperte, 6 decisioni aperte segnalate, 7 rischi identificati.
