# Discovery Tree View Refresh — 2026-05-12

**Fase**: A (read-only).
**Branch**: `alfonso-frontend-jjtl`.
**Output**: questo file + entry in `docs/claude-code-log.md`.
**Hard stop**: nessuna modifica al codice di runtime.

---

## 1. Componente Tree View

**File principali:**
- `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` — wrapper resolution-adaptive (sidebar/overlay). Header `<span>Tree View</span>` con icona `bi bi-diagram-2`. **Non** renderizza le righe; delega a `TreeViewContent`.
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — componente connesso Redux che renderizza l'intera gerarchia. Default export `TreeViewContent`. Wrapper Redux: `TreeViewContentConnected` esportato anche separatamente. Selector `mapStateToProps` (riga 1401) costruisce le strutture dati a partire da `state.idlookup`, `state.m2models`, `state.m1models`, `state.graphs`, `LProject.getProject().viewpoints`.
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` — stili.
- `frontend/src/components/TreeViewSidebar/index.ts` — re-export.

**Struttura componenti interna a `TreeViewContent.tsx`** (tutti `memo` in singolo file, ricorsivi):

| Componente | Linee | Ruolo | Badge | Bootstrap classe |
|---|---|---|---|---|
| `SectionNode` | 270–301 | Sezione sintetica collassabile (Megamodel, Metamodels, Viewpoints, Documentation, Syntax, Validation, Models) | nessuno (chevron + label uppercase) | `.tree-section` |
| `EntityRow` | 330–419 | **Riga condivisa** per ogni entità reale. Riceve `badge`, `badgeClassName`, `name`, `pillText`, `expandKey`, `isLeaf`, `expanded`, `onToggle`, `selected`, `onClick`, `onContextMenu`, `depth`, `extraIcon` (bezier2/stack), `tooltip`, `highlightAction`, `showNewBadge`. Renderizza problemi via `useNodeProblems`. | parametrico (`M`/`P`/`C`/`VP`/`m`) | `.tree-row` |
| `FeatureRow` | 423–456 | M1 instance leaf (feature). Senza chevron e senza tooltip. | nessuno; mostra "name : metaclass" | `.tree-row.tree-row--feature` |
| `ClassNode` | 460–517 | Classe (`C`). Sempre `isLeaf` (`expandKey={cls.id}` ma `isLeaf` true). | `C` | `.tree-DClass` |
| `PackageNode` | 521–613 | Package ricorsivo (`P`). | `P` | `.tree-DPackage` |
| `ModelNode` | 617–686 | Model M1 (`m`). **Hardcoded `pillText="M1"` (riga 660)** → vedi §3. | `m` | `.tree-nested-model` |
| `MetamodelNode` | 690–797 | Metamodel (`M`). Contiene packages + sub-section "Models" | `M` | `.tree-DModel` |
| `SubViewItem` | 801–861 | View foglia ricorsiva (sotto un viewpoint). **Attualmente badge `VP` con classe `tree-subview`** → punto aperto §2. | `VP` (sic) | `.tree-subview` |
| `ViewpointNode` | 863–933 | Viewpoint (`VP`). Mostra `extraIcon='stack'` se `!isExclusive`. | `VP` | `.tree-viewpoint` |
| `TransformationItem` | 937–1010 | Transformation. Badge personalizzato. | `C` (sic) | `.tree-transformation` |
| `DocumentationEmptyState` | 1014–1034 | Placeholder "Generate documentation" — non implementato. | n/a | `.tree-empty-doc` |
| `useClassifierContextMenu` (hook, 198–256) | — | Context menu "Create View" su classifier (DClass, DEnumerator, DModel, DPackage). Riusa `createViewInWorkbench`. | — | `.tree-node__context-menu` |
| `TreeViewContentComponent` | 1057–1322 | Root renderer; orchestra `SectionNode` per Megamodel → Metamodels/Viewpoints/Documentation + Transformations. | — | `.tree-view-content` |

**Note strutturali:**
- Una sola riga `EntityRow` condivisa, ergo le azioni inline (`+`, `copy`, `trash`) devono essere wired LÌ con prop opzionali (es. `onAddView`, `onDuplicate`, `onDelete`) attivate solo su Viewpoint e SubView. Vedi §6/§8 per il pattern hover-reveal.
- Espansione persistente: `DProject.expandedTreeNodes` (string[]). Convention: assenza = expanded; key prefissata `!` = collapsed esplicitamente. Helper `isExpandedFromArray`, `toggleInArray` (174–189). Cleanup orfani via `useEffect` (riga 1109).
- Le selezioni e gli eventi side-effect passano da `SetRootFieldAction.new('_lastSelected', {node, view, modelElement}, '', false)` (es. righe 437–441, 477–484, 716–724, 819–824, 879–890).

---

## 2. Stili e badge tipologici

### Sorgente attuale colore badge

**File:** `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss`

| Badge | Classe CSS | bg light | fg light | bg dark | fg dark | Linee |
|---|---|---|---|---|---|---|
| `M` Metamodel | `.tree-DModel` | `rgba(127,119,221,0.12)` | `#7F77DD` (viola) | transparent | `#B5B0F0` | 480–484 / 879 |
| `P` Package | `.tree-DPackage` | `rgba(136,135,128,0.12)` | `#888780` (grigio caldo) | transparent | `#c5c4be` | 486–488 / 880 |
| `C` Class | `.tree-DClass` | `rgba(55,138,221,0.12)` | `#378ADD` (blu) | transparent | `#7BB8F0` | 490–497 / 881 |
| `m` Model M1 | `.tree-nested-model` | `rgba(29,158,117,0.12)` | `#1D9E75` (teal) + italic | transparent | `#4ED8A4` | 536–540 / 889 |
| `VP` Viewpoint | `.tree-viewpoint` | nessun bg (eredita) | nessun color esplicito light; dark `#F08DB3` (pink) | transparent | `#F08DB3` | 1308–1313 / 978 |
| `VP` SubView | `.tree-subview` | nessun bg (eredita); dark trasparente | nessun color esplicito light; dark `#b0bec5` | transparent | `#b0bec5` | 1383–1387 / 963 |

Container generico: `.tree-node__icon` (linee 464–479) — 16×16px, border-radius 3px, font 10px weight 600.

### Sorgente di verità a livello applicativo

**File:** `frontend/src/common/entityMeta.ts` — definisce `ENTITY_META` come single-source-of-truth per icone/colori di tutti i tipi entità (artifact + sub-entity). I valori sono **diversi** rispetto alle classi CSS del tree per molte categorie. La docstring intera riga 50–55 dichiara `entityMeta.ts` autoritativo per "top-level artifacts" e demanda le sub-entity al SCSS del tree.

**Valori entityMeta.ts (light):**

| Tipo | Letter | bg | text |
|---|---|---|---|
| `metamodel` | `M` | `#EEEDFE` | `#534AB7` |
| `model` | `m` | `#FAEEDA` | `#854F0B` |
| `viewpoint` | `V` (sic — singolo char) | `#FCE7F3` | `#DB2777` |
| `transformation` | `T` | `#E1F5EE` | `#0F6E56` |
| `package` | `P` | `#DBEAFE` | `#2563EB` |
| `class` | `C` | `#FEE2E2` | `#DC2626` |
| `abstractClass` | `C` (italic) | `#FEE2E2` | `#DC2626` |

### Palette dashboard / megamodel (sample esistente)

**File:** `frontend/src/components/megamodel/MegamodelView.scss` (`.mm-card__icon--<type>`, 240–274) e `frontend/src/components/project/project-editor.scss` (`.list-card__icon--<variant>`, 645–704):

| Card | bg | text |
|---|---|---|
| Metamodel | `#EEEDFE` | `#534AB7` |
| Model | `#FAEEDA` / `#FEF3C7` (incongruenza tra MegamodelView e project-editor) | `#854F0B` / `#D97706` |
| Viewpoint | `#FCE7F3` / `#FAEEDA` (incongruenza) | `#DB2777` / `#854F0B` |
| Transformation | `#E1F5EE` | `#0F6E56` |

### Mismatch vs prompt

Il prompt B.1 chiede:

| Badge | bg | fg |
|---|---|---|
| `M`, `P`, `C` | `#EEEDFE` | `#3C3489` |
| `m` | `#FAEEDA` | `#854F0B` |
| `VP`, `v` | `#FBEAF0` | `#72243E` |

**Punto critico:** nessun sorgente esistente usa esattamente i text-color richiesti dal prompt (`#3C3489` purple-800, `#72243E` pink-800). I bg `#FBEAF0` e `#EEEDFE` esistono in vari file ma sempre accoppiati a foreground più chiari (`#534AB7` / `#DB2777`). Inoltre il prompt richiede di **collassare P e C sul medesimo viola di M**, mentre oggi P è grigio caldo e C è blu — distinzione semantica che oggi esiste.

Vedi "Punti aperti" §1.

### Token CSS variables disponibili (frontend/src/styles/tokens/_colors-light.scss)

Sono tutti slate + functional (red/green/amber/blue). Non esistono token per `purple-50/-800`, `pink-50/-800`, `amber-50/-800` distinti dai semantic colors. La palette categorica (purple/pink/amber/teal) vive solo come hex literals in `entityMeta.ts` e nei SCSS dei singoli componenti. **Tutti i valori richiesti dal prompt andrebbero introdotti come nuovi token o letterali in `entityMeta.ts`**. CLAUDE.md vieta esplicitamente variabili CSS dentro file di componente — il refresh dovrebbe creare token `--color-category-{metamodel,model,viewpoint}-bg/text` (o aggiornare `entityMeta.ts`).

---

## 3. Badge M1 doppione

**File:** `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`, riga 660 (dentro `ModelNode`):

```tsx
<EntityRow
    badge="m"
    badgeClassName="tree-nested-model"
    name={model.name}
    pillText="M1"           // ← riga 660
    expandKey={model.id}
    ...
/>
```

**Logica:** la prop `pillText` è hardcoded a `"M1"` senza condizioni — appare per ogni `ModelNode`. Renderizzato in `EntityRow` riga 384 come `<span className="tree-pill">{pillText}</span>`. CSS `.tree-pill` a `tree-view-sidebar.scss:1581–1594`.

**Impatto rimozione:** puramente cosmetico. Il pill non è cliccabile, non ha handler, non incide su routing o selezione. Soluzioni equivalenti:
- (a) `EntityRow` invocato senza `pillText`;
- (b) cancellare la riga 660 in `ModelNode`;
- (c) lasciare il pill in `EntityRow` ma cambiare callsite — preferibile per non rompere altri usi (cercato: `pillText` ha un solo callsite, riga 660, quindi (b) è sicuro).

`.tree-pill` resta in CSS — può essere rimosso o tenuto per uso futuro.

---

## 4. Chevron

**Già Bootstrap Icons.** Renderizzati in:
- `SectionNode` riga 287: `<i className={\`bi bi-chevron-${expanded ? 'down' : 'right'}\`} />`
- `EntityRow` riga 375: `<i className={\`bi bi-chevron-${expanded ? 'down' : 'right'}\`} />`

CSS della cella chevron: `.tree-node__toggle` (`tree-view-sidebar.scss:417–443`), 14×14px, font-size icona 10px, color `#94a3b8` → `:hover` `var(--color-text-primary)`. Slot leaf invisibile a `.tree-node__toggle.is-leaf` (1572–1577).

Nessun glifo testuale (`>` `v`) rimasto nel tree. La sostituzione richiesta dal prompt §B.3 è **già fatta**.

---

## 5. Selezione

### Meccanismo

Selezione globale via Redux: `state._lastSelected` con shape `{ node, view, modelElement }` (3 pointer string). Setter: `SetRootFieldAction.new('_lastSelected', {...}, '', false)`. Reader nel tree: `selectedElementId = state._lastSelected?.modelElement` (riga 1561), poi confrontato per ogni nodo con `isSelected = selectedId === pkg.id` etc.

Le righe che settano selezione (e quindi reagisce il tree):
- Classe — `ClassNode.handleClick` (477–484), setta `modelElement: cls.id`
- Package — `PackageNode.handleClick` (547–554)
- Model M1 — `ModelNode.handleClick` (634–642)
- Metamodel — `MetamodelNode.handleClick` (717–725) — setta anche `node` e `view`
- Feature/instance — `FeatureRow.handleClick` (434–445) — setta anche `view: ''`
- SubView — `SubViewItem.handleClick` (817–829) — setta `view: view.id, modelElement: ''`
- Viewpoint — `ViewpointNode.handleClick` (879–891)
- Transformation — `TransformationItem.handleClick` (958–969)

### Stile attuale

`EntityRow` riga 365 applica `tree-row--selected` quando `selected={...}` true. CSS (`tree-view-sidebar.scss:1521–1539`):

```scss
&--selected {
    background-color: var(--color-info-muted);    // rgba(59,130,246,0.12) — blu
    &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 2px;
        background-color: var(--color-info);       // #3b82f6 — blu
        border-radius: 1px;
    }
}
```

**Barra verticale 2px a sinistra: già presente**. Background blu-tint: già presente.

### Mismatch vs prompt §B.4

Il prompt vuole **cyan** (`#e0f7fa` bg + `#0891b2` bar). Il codice usa **blu** (token `--color-info` / `--color-info-muted`). Per allinearsi:
- (a) override locale nel SCSS del tree (selettore `.tree-row--selected` con hex letterali);
- (b) nuovi token `--color-selection-bg / --color-selection-bar` aggiunti in `tokens/_colors-light.scss` + `_colors-dark.scss` (preferito da CLAUDE.md, "MAI variabili CSS dentro file di componente").

Vedi "Punti aperti" §3.

---

## 6. Hover-reveal esistente

### Pattern stabilito: `.list-card__actions` (Dashboard)

**File:** `frontend/src/components/project/project-editor.scss:742–754`.

```scss
&__item:hover &__actions { opacity: 1; }
&__actions {
    display: flex; gap: 6px;
    opacity: 0;
    transition: opacity 0.15s ease;
    position: relative; z-index: 10;
    pointer-events: auto;
}
&__actions > * { pointer-events: auto; }
```

Usato in `ProjectEditor.tsx:2033` (`<div className="list-card__actions">`). Le azioni sono `bi-three-dots-vertical` menu trigger + popup contestuale (non hover-revealed inline icons).

**Differenza rispetto al prompt §B.6**: la convention del progetto è `opacity: 0 → 1`, mentre il prompt suggerisce `visibility: hidden`. Entrambi prevengono layout shift; `opacity` consente la transition smooth. Si raccomanda `opacity` (consistente con resto codebase).

### Pattern alternativo: `NestedView.tsx`

**File:** `frontend/src/components/editors/views/NestedView.tsx:390–419`.

`<div className="hover-stuff">` contiene `<CommandBar>` con `Btn` icone per duplicate/delete sui view items dell'editor classico. Non usa `.list-card__actions` ma una propria classe `.hover-stuff` (stile non ispezionato in questa fase, presumibile pattern simile). API icone: `<Btn icon='bi-...'>` o `<i className='jj jj-...'>`.

**Riusabilità per Tree View:** il pattern `.list-card__actions` è già SCSS standalone e si applica naturalmente a una nuova classe `.tree-row__actions`. Va replicato in `tree-view-sidebar.scss` (non importato — manterrebbe scoping a `.tree-row` e niente collisioni). Le icone `bi-plus-lg`, `bi-copy`, `bi-trash3` sono Bootstrap Icons già usati nel resto della UI.

---

## 7. Rename inline

### Pattern stabilito: `ProjectEditor.tsx`

**File:** `frontend/src/components/project/ProjectEditor.tsx:806–836` (handlers), `2014–2032` (callsite).

**State (presumibile dichiarato sopra, non riletto in questa fase):**
- `renamingItem: { type: MenuType; id: string } | null`
- `renameValue: string`
- `renameInputRef: React.RefObject<HTMLInputElement>`

**Handlers:**
```tsx
const startRename = (type, id, currentName) => {
    setRenamingItem({ type, id });
    setRenameValue(currentName || '');
    closeMenu();
};

const handleRenameSubmit = (item: LModel) => {
    if (renameValue.trim()) {
        const newName = renameValue.trim();
        if (newName !== item.name) {
            item.name = newName;      // ← L-proxy write
            markDirty();
        }
    }
    setRenamingItem(null);
    setRenameValue('');
};

const handleRenameCancel = () => { setRenamingItem(null); setRenameValue(''); };

const handleRenameKeyDown = (e, item) => {
    if (e.key === 'Enter') handleRenameSubmit(item);
    else if (e.key === 'Escape') handleRenameCancel();
};
```

**JSX callsite (semplificato):**
```tsx
{renamingItem?.type === 'metamodel' && renamingItem?.id === mm.id ? (
    <input ref={renameInputRef} className="list-card__rename-input"
           value={renameValue}
           onChange={e => setRenameValue(e.target.value)}
           onBlur={() => handleRenameSubmit(mm)}
           onKeyDown={e => handleRenameKeyDown(e, mm)} />
) : (
    <span>{mm.name}</span>
)}
```

CSS `.list-card__rename-input` a `project-editor.scss:761–776` (border focus, padding, max-width).

**Apertura editing:** voce di menu "Rename" → `startRename('metamodel', mm.id, mm.name)`. **NON c'è double-click sul nome.** Il prompt §B.6 chiede "entra subito in inline edit mode" appena la View viene creata via `+` button → questo va attivato programmaticamente subito dopo `DViewElement.new2(...)`. Bisognerà ricavare l'ID della view appena creata, settare `renamingItem = { type: 'view', id: <newId> }` e focalizzare l'input al primo render via `useEffect` su `renameInputRef.current?.focus()`.

### Riusabilità per Tree View

Tre opzioni:
1. **Estrarre** un hook generico `useInlineRename<T>({ getName, setName })` in `frontend/src/hooks/` e usarlo in entrambi i posti. Più pulito ma più lavoro.
2. **Replicare** il pattern in `TreeViewContent.tsx` con stato locale al wrapper o (meglio) sollevato a `TreeViewContentComponent`. Meno DRY ma fast.
3. **Riutilizzare** lo state esistente di `ProjectEditor.tsx`: il tree è figlio gerarchico ma renderizzato in sidebar separata (`TreeViewSidebar`). Probabilmente fuori dal mounting tree di `ProjectEditor`. Verificare in §A se sono fratelli o nidificati.

Si raccomanda l'opzione (2) per la Fase B con possibile refactor a (1) in pulizia successiva.

**Per il caso "view appena creata":** dopo `DViewElement.new2`, l'ID della view è disponibile sincronamente nella callback (vedi view.tsx:303 `Constructors.end(callback)`). Settare `renamingItem` subito dopo. La view comparirà nel tree al re-render Redux successivo, e l'input renderizzerà già in modalità edit. `useEffect` su `renamingItem` esegue `inputRef.current?.focus()`.

---

## 8. API operazioni View

### Create View (child di Viewpoint specifico — caso `+` button)

**Stato:** parzialmente esistente ma non in forma pronta all'uso.

- `DViewElement.new2(name, jsxString, father0?, callback?, persist=true, id?)` — `frontend/src/view/viewElement/view.tsx:298–305`. Costruisce direttamente una `DViewElement`, popola `viewpoint` (line 302 risale via `father.viewpoint || Defaults.viewpoints[0]`), `father` (line 303 da `father0`), e accetta callback per setter opzionali. **Tutta la creazione passa per `Constructors.end()` che dispatcha `CreateElementAction` → tracciato da undo.** Non binda a classifier; lascia `oclCondition=''`, `appliableTo` default, ecc.
- `DViewElement.newDefault(forData?, forSelf?)` — `view.tsx:307–349`. Crea una view legata a una specifica metaclass/instance; usa `U.increaseEndingNumber('view_'+(forData?.className ? '_'+forData.className : '') + 0, false, false, predicateUnique)` per il nome (es. `view_DClass_0`). **Side-effect:** setta `appliableToClasses`, `oclCondition`, `palette`, `css`. Non quello che serve per "blank view from VP button".
- `createViewInWorkbench(elementId, elementName, className)` — `frontend/src/utils/lastViewpoint.ts:104–179`. Wrapper che richiede un classifier (DClass/DEnumerator/DModel/DPackage) per costruire l'OCL query. **Non usabile direttamente** per il caso prompt (view "vuota" su VP senza classifier preselezionato).

**Cosa manca per la Fase B:** un helper minimale tipo:

```typescript
// pseudo
function createBlankViewInViewpoint(dVp: DViewElement, nameSeed: string = 'New view') {
    const existingNames = (LPointerTargetable.fromD(dVp) as LViewElement).subViews.map(v => v?.name).filter(Boolean) as string[];
    const name = ensureUnique(nameSeed, n => existingNames.includes(n));
    const newView = DViewElement.new2(name, DEFAULT_VIEW_JSX_STRING, dVp, undefined, true);
    return newView; // ID e proxy disponibili
}
```

Dove `ensureUnique` può essere `U.increaseEndingNumber(seed, false, false, predicate)` esistente — **NB:** produce `New view2`, NON `New view (1)`. Vedi §10.

### Duplicate View

**Stato:** esistente.

- `LViewElement.duplicate(deep: boolean = true, new_vp?: DuplicateVPChange)` — `frontend/src/view/viewElement/view.tsx:1641–1730`. Implementazione del wrapper L. Wrapped in `TRANSACTION('duplicate ' + name, ...)`, quindi **tracciato da undo**. Genera clone con nome `${name} Copy` (riga 1655). Itera proprietà originali copiandole nel clone (subViews ricorsivi se `deep=true`).
- Esempio chiamata: `NestedView.tsx:414–418` — `<i onClick={(e)=>{ l.duplicate(); }} />` per shallow, `l.duplicate(true)` per deep. Dashboard `ProjectEditor.tsx:2347` per viewpoint via `handleDuplicateViewpoint(vp)` → `vp.duplicate()`.

**Suffisso `Copy` ≠ `(1)/(2)` del prompt.** Decisione necessaria — vedi §10 e "Punti aperti" §4.

### Delete View

**Stato:** esistente.

- `LViewElement.delete()` — eredita da `LPointerTargetable.delete()` definito in `joiner/classes.ts:2517–2520`: `get_delete(c) → TRANSACTION('delete ' + name, Dummy.get_delete(this, c))`. **Tracciato da undo.**
- Esempio: `NestedView.tsx:410` — `<i onClick={(e)=>{ l.delete(); }} />`. Dashboard `ProjectEditor.tsx:484` — `vp.delete()`.

**Side-effect:** `Dummy.get_delete` (riferimento `frontend/src/common/Dummy.ts:97`) gestisce anche il detach dal parent `viewpoints` array via `SetFieldAction(projectid, 'viewpoints', deletedID, '-=')`. Per le subView l'analogo è la rimozione dal `subViews` dictionary del father.

### Note su LModel proxy / convenzione progetto

CLAUDE.md sezione "Pattern Critici per Object Persistence" descrive il pattern **deferred attribute setting** per `DObject.new` (oggetti M1). **Non si applica qui** — le view operations sono su proxy L (LViewElement, LViewPoint) che restituiscono istanze sincrone con `.name`/`.subViews` direttamente scrivibili (lo dimostra `ProjectEditor.tsx:817 item.name = newName`). Il rename inline usa proprio questa API.

### Sommario API → fattibilità Fase B

| Operazione | API esistente | Pronto? |
|---|---|---|
| Create view in VP | `DViewElement.new2` + helper di naming | 80% — manca wrapper per "blank view nameseed" |
| Duplicate view | `lview.duplicate()` | 100% (ma naming `Copy` ≠ `(1)`) |
| Delete view | `lview.delete()` | 100% |

---

## 9. Undo/redo coverage

**Store/system:** `frontend/src/redux/action/action.ts:666–702` (`RedoAction`, `UndoAction`).
**Driver:** `Navbar.tsx:1146` — `UndoAction.new(1, user?.id, false).commit()`.
**Trigger keyboard:** non ispezionato in dettaglio (cercato `ctrl.z|undo` nei file root); il prompt assume "Ctrl+Z/Y nativo" già funzionante. Verificare in Fase B se shortcut globali ok per il flow create→delete della view.

**TRANSACTION coverage:**
- `lview.duplicate()` apre `TRANSACTION('duplicate ' + name, ...)` (view.tsx:1647) → coperto.
- `lview.delete()` apre `TRANSACTION('delete ' + name, ...)` (classes.ts:2519) → coperto.
- `DViewElement.new2` (via `Constructors.end()` → `CreateElementAction`) → coperto (`action.ts:720+` define `CreateElementAction`, anch'esso registra storia).
- Mutazioni post-creazione (es. `view.name = newName` durante rename) → ogni setter L-proxy che chiama `SetFieldAction` o equivalente apre un proprio undo entry (vedi `classes.ts:2150` `TRANSACTION(name+'.name', ...)`).

**Implicazione:** un singolo "create blank view + auto-rename + utente conferma" produce **2 undo entries** (create + name change). Aggiunge UX rumore — accettabile o problematico? Decisione progettuale, vedi "Punti aperti" §5.

**Conclusione:** undo/redo è già coperto per tutte e tre le operazioni richieste, senza wiring aggiuntivo.

---

## 10. Naming duplicati `(1)`, `(2)`

### Utility esistenti

| Path | Funzione | Output |
|---|---|---|
| `frontend/src/common/U.tsx:1496–1521` | `U.increaseEndingNumber(s, allowLastNonNumberChars=false, allowDecimal=false, increaseWhile?)` | Numero alla fine, **senza parentesi** (`view_DClass_0` → `view_DClass_1` → `view_DClass_2`). Accetta predicato uniqueness. |
| `frontend/src/view/viewElement/view.tsx:1655` | inline in `duplicate()` | `${name} Copy` |
| `frontend/src/components/project/ProjectEditor.tsx:1758` | inline in `handleDuplicateTransformation` | `${name} (copy)` (testo "copy" tra parentesi, NON numero) |
| `frontend/src/pages/components/Dashboard.tsx:436,457` | duplicate metamodel/model | **vuoto** (`e => {}`) — TODO non implementato |

### Realtà sul terreno

**Non esiste un'utility che produca `name (1)`, `name (2)`, ecc.** L'affermazione del prompt "(1), (2)" come "convenzione consolidata da progetto" è imprecisa. Le convenzioni effettive nel codebase:
- Suffisso numero senza parentesi (auto-create: `view_DClass_0/1/2`)
- Suffisso ` Copy` (LViewElement.duplicate)
- Suffisso ` (copy)` testuale (transformation duplicate)
- TODO/no-op (dashboard metamodel/model duplicate)

### Opzioni Fase B

1. **Adottare convenzione esistente `${name} Copy`** (cambia minimale, no nuova utility).
2. **Adottare convenzione esistente con incremento numerico senza parens** via `U.increaseEndingNumber`. Es: `New view` → `New view2` → `New view3`. Non bellissimo ma consistente.
3. **Creare nuova utility `U.suffixCopyParens(name, predicate)`** che produca `${name} (1)`, `${name} (2)`, ecc. Se `name` matcha già `^(.*) \((\d+)\)$`, incrementa il numero esistente. Edge case `Generic error view (1)` esiste → produce `Generic error view (2)`. **Questa è la semantica più vicina al prompt.** Richiede nuovo codice in `common/U.tsx` (~15 righe).

Vedi "Punti aperti" §4.

---

## Punti aperti

Ognuno richiede decisione di Alfonso prima di entrare in Fase B. Numerati per facile riferimento.

### §1 — Palette badge: nuovi colori vs allineamento esistente

Il prompt §B.1 chiede testo `#3C3489` / `#72243E` (purple-800 / pink-800) che **non esistono** in alcun sorgente. Le palette correnti (`entityMeta.ts`, dashboard, tree-view) usano `#534AB7` / `#DB2777` per stessi tipi.

Inoltre il prompt collassa `M`, `P`, `C` sullo stesso viola — oggi P è grigio caldo e C è blu (distinzione semantica utile per scan veloce del tree).

**Domande:**
- Si vogliono davvero introdurre nuovi hex `#3C3489` / `#72243E` o si accetta che il refresh usi i valori esistenti di `entityMeta.ts` (`#534AB7` / `#DB2777`)?
- Se nuovi: confermare che vanno aggiunti come token in `styles/tokens/_colors-light.scss` + `_colors-dark.scss` (mai dentro `tree-view-sidebar.scss`, da CLAUDE.md).
- Aggregare M/P/C sullo stesso viola perdendo la distinzione P/C corrente è desiderato?

### §2 — Differenziazione VP vs v (badge case)

Oggi `SubViewItem` usa `badge="VP"` (lettere maiuscole, 2-char) sia per il viewpoint che per le sub-view. Il prompt vuole `v` (1-char lowercase) per le view leaf.

**Domande:**
- Cambiare in `SubViewItem.tsx:834` da `badge="VP"` a `badge="v"` (con nuova classe `tree-view`, o riusare `tree-subview` cambiandone i contenuti)?
- Dimensioni: badge VP a 22×18px, `v` a 18×18px come da prompt? Allineamento verticale: confermare baseline coerente nelle righe miste (VP+v fratelli sotto stesso viewpoint).

### §3 — Selezione cyan vs blu (token)

Selection oggi usa `var(--color-info-muted)` + `var(--color-info)` (blue-500). Il prompt vuole cyan-50 + cyan-600 (`#e0f7fa` + `#0891b2`).

**Domande:**
- Introdurre nuovi token `--color-selection-bg / --color-selection-bar` o cambiare il valore di `--color-info`?
- Conferma: il design system globale usa cyan come "selection" anche altrove (canvas accent in `_colors-light.scss:205` è `#06b6d4` — pari a cyan-500), quindi una nuova famiglia `selection-*` allineata a cyan-600 ha coerenza con il canvas.

### §4 — Naming duplicati

`(1)/(2)` non esiste. Opzioni:
- (a) usare `Copy` esistente (`name` → `name Copy` → `name Copy Copy` o `name Copy 2`?).
- (b) usare `U.increaseEndingNumber` esistente → `name1, name2, ...` (no parens).
- (c) creare nuova utility `(1)/(2)`.

**Domanda:** quale convenzione vuoi adottare? (c) è la più vicina al prompt ma aggiunge ~15 righe di nuovo codice.

### §5 — Granularità undo per "create + auto-rename"

Quando l'utente clicca `+` su un VP: il flow è `DViewElement.new2('New view') → user enter rename mode → user types "MyView" → Enter → setter view.name = 'MyView'`. Questo produce **2 undo entries** (create con name='New view', poi rename).

**Domande:**
- Accettabile (2 Ctrl+Z per annullare la creazione)?
- O wrappare in TRANSACTION composita (lato Fase B, dopo che l'utente conferma il nome con Enter, fare commit batched)? Più complesso da implementare.
- O: nel flow "appena creato" se l'utente preme `Esc` (cancel), eseguire `lview.delete()` come reverse (richiede 2 azioni: create+delete entrambe undo'd in 2 click). Comportamento equivalente a "annulla la creazione".

### §6 — Layout shift hover-reveal: opacity vs visibility

Il prompt §B.6 suggerisce `visibility: hidden`. Il codebase usa `opacity: 0` (Dashboard). Entrambi prevengono shift; opacity consente transition. Si raccomanda `opacity: 0 → 1` per consistenza.

**Domanda:** confermi opacity? (Se sì, è una micro-decisione che posso prendere autonomamente in Fase B.)

### §7 — Helper `createBlankViewInViewpoint`

Non esiste. Opzioni:
- (a) inline in `TreeViewContent.tsx` come funzione locale (~10 righe);
- (b) aggiunto a `utils/lastViewpoint.ts` accanto a `createViewInWorkbench` (~10 righe + export);
- (c) aggiungere come metodo statico a `LViewPoint` o `DViewElement` (cambia API persistente — overkill).

**Domanda:** (b) sembra il posto giusto. Confermi?

### §8 — `tree-row__actions` SCSS scoping

Posizione attesa: dentro `tree-view-sidebar.scss`, nuove regole sotto la sezione "REDESIGN 2026-05-08" (riga 1437 in poi). Pattern come Dashboard ma con classi prefissate `.tree-row__*` per scoping.

**Domanda:** OK come posizione/naming, oppure preferisci un file separato `tree-row-actions.scss` con `@use` (overkill per ~30 righe)?

### §9 — Trash icon variant

`bi-trash3` vs `bi-trash` — Bootstrap Icons espone entrambi. Il prompt usa `bi-trash3`. Il codebase usa `bi-trash` (verificato `ProjectEditor.tsx:2090`). Allineare al prompt o al codebase esistente?

### §10 — Dark mode

Il prompt elenca solo colori light. Le palette dark equivalenti (`#3C3489` su `#EEEDFE` non funziona in dark, contrasto pessimo). Va definita la versione dark prima di Fase B oppure derivata automaticamente (purple-200 su rgba(viola, 0.2))?

---

## Riferimenti file (riepilogo path)

- `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` — wrapper sidebar
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — tree principale (1580 righe)
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` — stili
- `frontend/src/common/entityMeta.ts` — palette centralizzata entità
- `frontend/src/components/megamodel/MegamodelView.scss` — palette dashboard megamodel
- `frontend/src/components/project/project-editor.scss` — palette dashboard list-card + rename input + hover-reveal
- `frontend/src/components/project/ProjectEditor.tsx:806–836` — pattern rename inline
- `frontend/src/styles/tokens/_colors-light.scss` — token CSS
- `frontend/src/view/viewElement/view.tsx:298–305` — `DViewElement.new2`
- `frontend/src/view/viewElement/view.tsx:1641–1730` — `duplicate()`
- `frontend/src/utils/lastViewpoint.ts:104–179` — `createViewInWorkbench`
- `frontend/src/components/editors/views/NestedView.tsx:390–419` — esempio duplicate/delete UI
- `frontend/src/common/U.tsx:1496` — `U.increaseEndingNumber`
- `frontend/src/redux/action/action.ts:666–702` — Undo/Redo classes
- `frontend/src/joiner/classes.ts:2517–2520` — base delete TRANSACTION

---

**Fine Fase A.** Nessun file di runtime modificato.
