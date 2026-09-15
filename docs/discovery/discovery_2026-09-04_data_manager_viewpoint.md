# Discovery: il Data Manager Viewpoint singleton (R-DMV, Fase 1)

**Data**: 2026-09-04
**Prompt**: `docs/prompts/claude_2026-09-04_1545_prompt_data_manager_viewpoint_fase1.md`
**Memo di ratifica**: `docs/ratifiche/claude_2026-09-04_1545_memo_ratifica_data_manager_viewpoint.md`
**Decisioni**: R-DMV-1..7 (`docs/decisions.md:2909-2942`), R-VP-4, R-VP-10, R-VP-11, R-VP-14, R-B9
**Repo**: branch `alfonso-frontend-jjtl`, HEAD al momento della lettura `3d33cc541`
**Tipo**: Fase 1 read-only. Nessun file di codice modificato.

> Il prompt dichiara HEAD `c582c2bbb` più il commit docs. In albero, al momento della lettura,
> HEAD è `3d33cc541` (`docs(log)` della rimozione R-VP-14) sopra `12f168fa5` (docs R-DMV) sopra
> `c582c2bbb`. Nessun file applicativo è cambiato fra i tre: la premessa regge, la catena è più
> lunga di una entry di log.

---

## 0. Esito in una pagina

| # | Ipotesi | Esito | Dove sta la prova |
|---|---------|-------|-------------------|
| H1 | `ViewpointType` è il posto giusto per marcare il singleton | **Confermata, con un vincolo non ovvio e portante** | §2 |
| H2 | La voce «Data manager» del picker può restare la porta e in più selezionare il singleton nel rail | **Confermata** | §3 |
| H3 | `computeIRSignature` / `getIRIndex` vanno parametrizzati sul viewpoint | **Confermata** | §4 |
| H4 | `ViewpointProperties` + `FormAuthoringBody` si rimontano nel rail col solo dispatch sul tipo | **Parzialmente falsificata** | §5 |
| H5 | `newVP` è la sola via di creazione; un punto ciascuno per creazione, duplicazione, cancellazione | **Falsificata nei numeri**: i punti sono più di uno per voce | §6 |
| H6 | `pruneForm` va esteso a `order`, `labels`, `hidden` e alla chiave delle colonne | **Confermata a metà**: le tre chiavi di `FormSpec` sì, la chiave delle colonne **non passa da `pruneForm`** | §7 |

**Il finding che vale il referto** (§2.3): il singleton deve nascere e restare con
`isExclusiveView === true`. Non è cosmetico. Il motore delle view classiche
(`selectors.ts:552-559`) applica come **decorative** le view di ogni viewpoint **non attivo e non
esclusivo**: un singleton creato con `isExclusiveView: false` — che è esattamente ciò che farebbe
il pattern di `handleCreateViewpoint` per un tipo diverso da `syntax` — riverserebbe le sue view di
classe sul canvas classico di ogni progetto. Il default del costruttore (`classes.ts:1181`) è
`true` e va lasciato tale, contro l'istinto che dice «non è una sintassi, quindi non è esclusivo».

---

## 1. File letti (path completi)

Letti per intero o nelle regioni citate:

- `frontend/src/view/viewPoint/viewpoint.ts` (61 righe, intero)
- `frontend/src/view/viewElement/view.tsx` (`:210-275` campi propri, `:1853-1900` `get_duplicate`)
- `frontend/src/components/editor-v2/dataManagerOption.ts` (intero)
- `frontend/src/components/editor-v2/Toolbar.tsx` (`:250-430`)
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (`:40-80`, `:1390-1470`,
  `:1490-1620`, `:1800-1870`, `:2040-2240`, `:2600-2660`)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (`:1495-1570`, `:2995-3090`)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (`:90-250`)
- `frontend/src/components/editor-v2/viewpoint/ir/useIRFormView.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/managerViews.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (`:180-230`, `:410-450`)
- `frontend/src/components/editor-v2/viewpoint/ir/formHosts.ts` (`:1-60`)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (`:200-345`, `:425-475`)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (`:150-215`, `:279-300`, `:419-435`)
- `frontend/src/components/editors/viewpoint/properties/ViewpointProperties.tsx` (intero)
- `frontend/src/components/editors/Info.tsx` (`:1355-1405`)
- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx` (`:1-200`, `:320-420`)
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts` (`:25-110`, `:230-260`)
- `frontend/src/components/project/ProjectEditor.tsx` (`:1175-1215`, `:2655-2700`)
- `frontend/src/redux/VersionFixer.tsx` (`:1180-1216`, elenco dei metodi di migrazione)
- `frontend/src/utils/lastViewpoint.ts` (`:49-75`, `:191-217`)
- `frontend/src/joiner/classes.ts` (`:1145-1200`, `:1271-1280`, `:3403-3465`, `:4140-4190`)
- `frontend/src/redux/selectors/selectors.ts` (`:417-437`, `:551-566`)
- `frontend/src/common/Defaults.ts` (`:27`, `:80-125`)
- `frontend/src/components/abstract/DockManager.tsx` (`:160-175`, `:240-290`)
- `frontend/src/components/abstract/tabs/instanceTable.ts` (`:134-148`)
- `frontend/src/components/editor-v2/viewpoint/ir/widgetRenderer.ts` (`:108-140`)
- `frontend/src/jjform/widgetValue.ts` (`:20-42`)
- Test: `frontend/src/components/editor-v2/__tests__/dataManagerPicker.test.ts`,
  `frontend/src/components/editors/viewpoint/properties/__tests__/viewpointThemeHint.test.ts`,
  `frontend/src/components/editor-v2/viewpoint/ir/__tests__/managerViews.test.ts` (intestazione + `it`)

**Critical zone**: nessuno dei file di `CLAUDE.md` §3.1 è stato letto in scrittura né è
implicato dalle proposte. `useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`,
`syncState.ts`, `useM1ReferenceEdges.ts` non compaiono. `VersionFixer.tsx` è stato letto in
sola lettura per rispondere alla domanda 6; la risposta è che **non serve migrazione** (§8).

---

## 2. H1 — Dove marcare il singleton

### 2.1 Cosa esiste oggi

`frontend/src/view/viewPoint/viewpoint.ts:13-21`:

```typescript
export type ViewpointType = 'syntax' | 'decoration' | 'validation' | 'semantics' | 'editor_behavior';

/** Derives the viewpoint type from legacy booleans + explicit field */
export function getViewpointType(vp: DViewElement): ViewpointType {
    if ((vp as any).viewpointType) return (vp as any).viewpointType;
    if (vp.isValidation) return 'validation';
    if (vp.isExclusiveView) return 'syntax';
    return 'decoration';
}
```

Il campo esplicito **vince sui booleani legacy** ed è il primo test. Il campo è dichiarato su
`DViewElement`, non su `DViewPoint` (`view/viewElement/view.tsx:221`), con la ragione scritta a
`:233-238`: «`DViewPoint` carries no own data field at all». Vale anche per `formTheme` (`:247`).

Chi legge `getViewpointType`, per intero (4 siti di chiamata, 2 di import):

| Sito | Cosa ne fa |
|------|-----------|
| `TreeViewContent.tsx:2617` | costruisce `TreeViewpointData.vpType` e `isExclusive` per l'albero |
| `ProjectEditor.tsx:2676` | badge del tipo nella lista VIEWPOINTS della dashboard di progetto |
| `ViewpointProperties.tsx:34` | il segmented «Type» del rail |
| `joiner/index.ts:198` | riesporto |

Il campo `viewpointType` è **scritto** in due punti soli: `ViewpointProperties.tsx:45`
(`(viewpoint as any).viewpointType = newType;`) e `ProjectEditor.tsx:1210`.

### 2.2 Cosa legge la sidebar, e cosa il picker

**Sidebar** (`TreeViewContent.tsx:2040-2051`), verbatim:

```typescript
const { syntaxVps, validationVps, otherVps } = useMemo(() => {
    ...
    for (const vp of displayViewpoints) {
        if (vp.vpType === 'syntax') syntax.push(vp);
        else if (vp.vpType === 'validation') validation.push(vp);
        else other.push(vp);
    }
```

Il partizionamento è un **catch-all**: un valore nuovo di `ViewpointType` finisce in `otherVps` e
viene reso a `depth={2}` come `ViewpointNode` nudo, sotto «Viewpoints» e senza sottosezione
(`:2229-2240`). Quindi un tipo nuovo, senza altro lavoro, **compare** nella sidebar: per R-DMV-5
va tolto da lì e portato sotto una sezione propria.

La lista da cui partono è `LProject.viewpoints`, cioè `classes.ts:3431-3450`, che filtra solo
`Defaults.isSystemViewpoint` (`Pointer_ViewPointDefault`).

**Picker della toolbar** (`Toolbar.tsx:268-276`), verbatim:

```typescript
const viewpointPointers = useSelector((state: any) => state.viewpoints) as string[];
const viewpoints = (viewpointPointers || [])
    .filter(ptr => !Defaults.isSystemViewpoint(ptr))
```

Sorgente **diversa** dalla sidebar (la root `state.viewpoints`, popolata dal reducer per ogni
`DViewPoint`: `redux/reducer/reducer.ts:464-467` deriva `SetRootFieldAction` su
`elem.className.substring(1).toLowerCase() + 's'`), stesso filtro. Anche qui il singleton
entrerebbe senza un'esclusione esplicita.

Altre due liste che oggi escludono per `isSystemViewpoint` e vanno considerate:
`MegamodelView.tsx:153` e `Dashboard.tsx:498`.

### 2.3 Il vincolo portante: `isExclusiveView` non è cosmetico

`redux/selectors/selectors.ts:552-559`, verbatim:

```typescript
// don't match exclusive views from other vp
let dvp: DViewPoint = DPointerTargetable.fromPointer(dview.viewpoint, state);
let oldVpMatch: number = tnv.viewPointMatch;
if (dvp.id === activevpid) tnv.viewPointMatch = ViewEClassMatch.VP_Explicit;
else if (dvp.id === 'Pointer_ViewPointDefault') tnv.viewPointMatch = ViewEClassMatch.VP_Default;
else if (!dvp.isExclusiveView) tnv.viewPointMatch = ViewEClassMatch.VP_Decorative;
else tnv.viewPointMatch = ViewEClassMatch.VP_MISMATCH;
```

Lettura: le view di un viewpoint **non attivo** sono scartate (`VP_MISMATCH`) **solo se il
viewpoint è esclusivo**. Se non lo è, diventano **decorative** e vengono applicate sul canvas
classico insieme alla sintassi attiva (`joiner/classes.ts:4176` le smista in `decorativeViews`).

Il default del costruttore è dalla parte giusta — `joiner/classes.ts:1181`:
`thiss.isExclusiveView = true;` — ma il pattern di creazione esistente lo **spegne** per ogni
tipo che non sia `syntax` (`ProjectEditor.tsx:1195-1207`):

```typescript
default: // decoration, semantics, editor_behavior
    vp.isExclusiveView = false;
    vp.isValidation = false;
    break;
```

**Conseguenza per la Fase 2**: il creatore del singleton **non deve** passare per quello switch, e
il segmented «Type» di `ViewpointProperties.tsx:41-48` — che scrive
`viewpoint.isExclusiveView = (newType === 'syntax')` — **non deve essere raggiungibile** con il
singleton selezionato. Sono due punti distinti, entrambi in grado di trasformare il singleton in
un viewpoint decorativo silenziosamente attivo su ogni canvas.

Il lato IR è invece al sicuro per costruzione: `getIRIndex` filtra `if (!d || d.viewpoint !== vp)
continue` con `vp = state.viewpoint` (`irResolveCore.ts:141-153`), quindi finché il singleton non
è mai attivo le sue view IR non raggiungono il canvas. Il rischio è **solo** sul motore classico.

### 2.4 Proposta

**Un valore nuovo di `ViewpointType`, non un flag a parte.** Nome proposto: `'dataManager'`
(camelCase come `editor_behavior` non è: quello è snake. Le due grafie già convivono nell'union;
`'dataManager'` si allinea a `DATA_MANAGER_OPTION_*` e a `isDataManagerOption`, che sono il
vocabolario già ratificato per questa cosa. Alternativa coerente con `editor_behavior`:
`'data_manager'`. Entrambe libere: 0 occorrenze, §9).

Ragioni contro un flag `builtin` separato:
1. `getViewpointType` è già il **discriminatore unico** letto da tutti e quattro i consumatori;
   un flag parallelo creerebbe due assi da tenere in accordo (il fallimento che `§3.13` di
   `CLAUDE.md` racconta per `className`).
2. Un valore nuovo dell'union è additivo sul persistito: `viewpointType` è già `optional`
   (`view.tsx:221`), un progetto salvato non lo porta e `getViewpointType` continua a derivarlo
   dai booleani.
3. Il partizionamento della sidebar è già un catch-all: il valore nuovo **si vede** subito, il che
   rende il lavoro di §5 visibile invece che silenzioso.

**Ma serve comunque un predicato**, perché tre liste diverse devono escluderlo (`Toolbar`,
`ProjectEditor`, `MegamodelView`/`Dashboard`) e una deve includerlo (la sidebar, in una sezione
propria). Proposta: una funzione accanto a `getViewpointType`, in `viewpoint.ts`:

```typescript
export const DATA_MANAGER_VIEWPOINT_TYPE: ViewpointType = 'dataManager';
export function isDataManagerViewpoint(vp: DViewElement | undefined | null): boolean {
    return !!vp && getViewpointType(vp as any) === DATA_MANAGER_VIEWPOINT_TYPE;
}
```

Un predicato per pointer come `Defaults.isSystemViewpoint` (`Defaults.ts:105`) **non** funziona
qui: quello si basa su un id costante seminato allo startup (`Defaults.viewpoints:27`), mentre
R-DMV-6 vuole la nascita alla prima scrittura. Un id fisso resta possibile (`newVP` accetta un
`id` esplicito, `viewpoint.ts:38`) e semplificherebbe il ritrovamento (§8.2), ma va deciso con
Alfonso: vedi domanda aperta Q3.

---

## 3. H2 — Il picker: **confermata**

`Toolbar.tsx:326-336`, verbatim:

```typescript
const handleViewpointChange = useCallback((vpId: string) => {
    if (isDataManagerOption(vpId)) {
        if (!modelId) return;
        try {
            const lm = LPointerTargetable.fromPointer(modelId) as LModel;
            if (lm) DockManager.openManager(lm);
        } catch (e) {
            console.warn('[Toolbar] Data manager: model not resolvable', modelId, e);
        }
        return;
    }
    activateViewpoint(vpId || null);
}, [modelId]);
```

Il sentinel `'@data-manager'` (`dataManagerOption.ts:23`) è intercettato **prima** di
`activateViewpoint`, e `activateViewpoint` è l'unico scrittore di `state.viewpoint`
(`utils/lastViewpoint.ts:70`, 3 chiamanti di produzione: `Toolbar.tsx:334`,
`EditorSwitch.tsx:93`, e nessun altro). Quindi **il singleton non può diventare
`state.viewpoint` passando di qui**: è già la porta giusta e non serve toccarla per aprirlo.

Per «in più selezionare il singleton nel rail» il meccanismo esiste già ed è quello che
`DockManager.openViewpoint` usa (`DockManager.tsx:252-262`):

```typescript
const applySelection = () => {
    try {
        SetRootFieldAction.new('_lastSelected' as any, {
            node: '', view: vp.id, modelElement: '',
        });
```

`openViewpoint` **non apre nulla sul canvas**: scrive `_lastSelected.view`, che è ciò che
`Info.tsx:1373` legge per rendere `ViewpointProperties`. È esattamente la selezione nel rail
richiesta da R-DMV-4, senza toccare `state.viewpoint`.

**Rischio sui test**: `dataManagerPicker.test.ts:171-176` asserisce che il ramo del sentinel, dal
`isDataManagerOption(vpId)` fino a `activateViewpoint(`, contenga `return;` e **non** contenga
`activateViewpoint`. Aggiungere in quel ramo un `SetRootFieldAction` (o una chiamata a
`DockManager.openViewpoint(singleton)`) **non** viola le asserzioni. Da verificare invece
`:178-183`, che pretende `body).not.toContain('TabDataMaker')` e `not.toContain('InstanceManagerTab')`:
nessuno dei due nomi entrerebbe. E `:192-195` pretende letteralmente `'}, [modelId]);'` nel file:
se le deps del callback cambiano, quel test va aggiornato **con** il codice.

---

## 4. H3 — L'indice del singleton: **confermata**, e va parametrizzato

### 4.1 Il vincolo

`irResolveCore.ts:116-127`, verbatim:

```typescript
export function computeIRSignature(state: any): string {
    const vp = state.viewpoint;
    if (!vp) return '';
    const lookup = state.idlookup;
    const parts: string[] = [vp];
    const list: string[] = state.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== vp) continue;
```

e `:134-141`:

```typescript
export function getIRIndex(state: any, signature: string): IRViewpointIndex | null {
    if (!signature) return null;
    const cached = indexCache.get(signature);
    if (cached) return cached;

    const vp = state.viewpoint as string;
```

Entrambe leggono `state.viewpoint` **direttamente**. Il manager oggi ne dipende:
`InstanceManagerTab.tsx:1523` (il prompt dice `:1522`, è `:1523`):

```typescript
const irIndex = useSelector((state: any) => getIRIndex(state, computeIRSignature(state)));
```

Con R-DMV-1 il manager deve leggere dal singleton. **Serve un parametro esplicito.**

### 4.2 Chi altro le chiama (conteggio)

Siti di chiamata di **produzione** (esclusi import, commenti, definizione e test):

`computeIRSignature` — **19**:
`InstanceManagerTab.tsx:1523`; `EditorV2.tsx:202, 1104, 1523, 3277`;
`useIRContainment.ts:63, 74, 82`; `irResolve.ts:50, 92, 104, 138, 162, 182, 193`;
`useIRFormView.ts:67, 93, 113`; `treeViewScope.ts:104`.

`getIRIndex` — **16**:
`InstanceManagerTab.tsx:1523`; `EditorV2.tsx:204, 1104, 3277`;
`useIRContainment.ts:66, 84, 122, 135`; `irResolve.ts:93, 105, 141, 183, 198`;
`useIRFormView.ts:94, 114`; `treeViewScope.ts:104`.

Nei **test**, `getIRIndex` è chiamata direttamente da `ir.test.ts` (30 siti), `irMarked.test.ts`
(6) e `edgeAuthoring.test.ts` (2), sempre con una firma finta e uno `state` costruito a mano.

Di questi, quelli che devono passare al **singleton** sono due soli: `InstanceManagerTab.tsx:1523`
(la tabella) e le tre chiamate dentro `useIRFormView.ts` (il drawer, §4.3). Tutti gli altri —
canvas, containment, scope dell'albero — restano sul viewpoint attivo e **non vanno toccati**.

### 4.3 `useIRFormView` ha lo stesso vincolo, in tre punti

`useIRFormView.ts:67`, `:93`, `:113` chiamano `computeIRSignature(state)` senza argomenti, e la
firma della subscription (`:67`) mette `irSig` in testa allo snapshot dello slot. Il drawer del
manager monta `IRForm` (`InstanceManagerTab.tsx:3002` e `:3036`), che chiama `useIRFormView`.
Quindi **il drawer oggi risolve la view di classe contro il viewpoint attivo**, non contro il
singleton: stesso difetto della tabella, in un modulo diverso.

C'è un **terzo** lettore di `state.viewpoint` nella stessa catena, e non passa da qui —
`IRForm.tsx:214-218`, verbatim:

```typescript
const viewpointTheme = useSelector((state: any) => {
    const vp = state?.viewpoint;
    const t = vp ? state?.idlookup?.[vp]?.formTheme : undefined;
    return isFormThemeName(t) ? t : undefined;
});
```

È il rung del tema della cascata (STYLE2). Per R-DMV-4 («poter scegliere il tema visuale» sul
singleton) **anche questo** deve leggere dal singleton quando `host === 'manager'`. Tre punti,
non uno.

### 4.4 Forma proposta del cambiamento

Parametro opzionale con default all'attivo, così i 16+19 siti esistenti restano invariati:

```typescript
export function computeIRSignature(state: any, viewpointId?: string): string {
    const vp = viewpointId ?? state.viewpoint;
    ...
}
export function getIRIndex(state: any, signature: string, viewpointId?: string): IRViewpointIndex | null {
    ...
    const vp = viewpointId ?? (state.viewpoint as string);
```

**La cache regge senza altre modifiche**: `indexCache` è chiavata sulla sola `signature`
(`:132`, `:180`), e la signature ha già l'id del viewpoint come `parts[0]` (`:120`). Due indici
per due viewpoint diversi hanno quindi chiavi diverse per costruzione — nessuna collisione da
introdurre e nessuna chiave composita da inventare.

**Un punto di attenzione misurato**, `irResolveCore.ts:229-235`:

```typescript
for (const [oldSig, oldIdx] of indexCache) {
    if (oldIdx.viewpointId === vp && oldSig !== signature) {
        for (const oldVid of oldIdx.viewIds) if (!viewIds.includes(oldVid)) removeViewCss(oldVid);
        indexCache.delete(oldSig);
    }
}
```

Il ciclo di vita del CSS è **già** per-viewpoint (`oldIdx.viewpointId === vp`), quindi un secondo
viewpoint indicizzato non fa sfrattare le view del primo. Confermato per lettura, non per
esecuzione: da mettere sotto test nella slice che introduce il parametro.

---

## 5. H4 — Il rail del singleton: **parzialmente falsificata**

### 5.1 Cosa funziona già

`Info.tsx:1373-1390`, verbatim:

```typescript
if (tab && selectedView && (selectedViewClass === DViewPoint.cname || selectedViewClass === DViewElement.cname)) {
    const isVP = selectedViewClass === DViewPoint.cname;
    ...
            {isVP ? (
                <ViewpointProperties
                    key={selectedView.id as any}
                    viewpoint={selectedView as unknown as LViewPoint}
                    readOnly={false}
                />
```

Il dispatch è su `className`, non sul tipo: **un `DViewPoint` selezionato rende già
`ViewpointProperties`**, singleton compreso, senza toccare `Info.tsx`. Il campo «Form theme»
(`ViewpointProperties.tsx:126-138`) è già lì e già scrive `formTheme` sul viewpoint selezionato
(`:66-70`). Per la metà «tema» di R-DMV-4 **non serve codice nuovo nel rail**: serve solo che
`IRForm` legga quel tema dal singleton invece che dall'attivo (§4.3).

### 5.2 Dove H4 si rompe

**(a) Il segmented «Type» va nascosto.** `ViewpointProperties.tsx:107-123` rende cinque bottoni
che scrivono `viewpointType`, `isExclusiveView` e `isValidation`. Con il singleton selezionato,
premerne uno lo declassa a viewpoint ordinario — e, per §2.3, lo rende decorativo e attivo sul
canvas. Non è un dettaglio estetico: è il punto di rottura più economico dell'intera decisione.

**(b) L'hint mente.** `ViewpointProperties.tsx:139-141`:

```typescript
{!isActiveViewpoint && (
    <p className="wp-field__hint">Applies when this viewpoint is active.</p>
)}
```

`isActiveViewpoint` confronta con `state.viewpoint` (`:93-94`). Il singleton **non è mai**
`state.viewpoint` per R-DMV-1, quindi l'hint sarebbe **sempre** visibile e direbbe una cosa falsa
(«si applica quando questo viewpoint è attivo»: non lo sarà mai, e il tema si applica comunque).

**(c) `FormAuthoringBody` non si monta com'è.** Le sue props (`:381-393`) sono
`{ draft: VertexViewIR, target: MetaclassInfo | null, advanced, viewId?, onChange }`. Vuole una
**view di classe già esistente** (`draft`) e una metaclasse **già scelta** (`target`). Nel rail del
singleton non c'è nessuna delle due: la view va creata alla prima scrittura (R-DMV-6) e la
metaclasse va scelta dall'utente. Serve quindi un **guscio** sopra di esso — selettore di
metaclasse + materializzazione — non un rimontaggio.

Nota di scoping: `FormAuthoringBody` monta anche `theme`/`labelPlacement`
(`THEME_OPTIONS:77-82`, `LABEL_PLACEMENT_OPTIONS:84-87`), che sul singleton **duplicherebbero** il
campo «Form theme» del viewpoint a un livello diverso della cascata (view vs viewpoint). Per la
slice minima conviene montarne solo la tabella dei widget, o passare `advanced` in modo da
gaterla; va deciso (Q5).

**(d) Test che si rompe.** `viewpointThemeHint.test.ts:80-84` asserisce sul sorgente di
`ViewpointProperties.tsx`:

```typescript
expect(CODE).not.toContain('LProject.getProject');
expect(CODE).not.toContain('viewpoints');
expect(CODE).not.toContain('_lastSelected');
```

Un editor per classe dentro questo file che leggesse una di quelle tre sorgenti **fallisce il
test**. Il test è nel giusto (proibisce una seconda derivazione di «attivo»), quindi la strada
pulita è un **componente separato** montato accanto, non codice nuovo dentro
`ViewpointProperties.tsx`.

### 5.3 Proposta minima della UI per classe

Un componente nuovo, es. `DataManagerViewpointPanel.tsx`, montato da `Info.tsx` **al posto** di
`ViewpointProperties` quando `isDataManagerViewpoint(selectedView)`, che contiene:

1. **Nome + Form theme** — riusando gli stessi controlli, senza il segmented «Type» e senza l'hint
   (risolve (a) e (b) per esclusione invece che per condizione).
2. **Selettore di metaclasse** — `getMetaclassInfo(modelId).allClasses`
   (`useEditorMode.ts:239`) dà `MetaclassInfo[]`; il selettore ne sceglie una.
3. **Tabella feature → widget** — `rowsForMetaclass(target)`
   (`FormAuthoringBody.tsx:333`) dà le righe dal solo metamodello; `deriveAuthoringWidget(row)`
   (`:95`) il widget derivato; `offeredOverrides(derived)` (`:107`) le alternative legali;
   `widgetLabel` (`:89`) le etichette. Nessuna istanza, nessuno slot.
4. **onChange** → `withFormEntry(form, 'widgets', name, value)` (`:156`) sul `FormSpec` della view
   di classe del singleton, creandola se manca (§8).

Il punto 3 è **la ragione per cui H4 è solo parzialmente falsa**: la logica di derivazione e di
compatibilità è già tutta pura ed esportata, e non va riscritta. Solo il guscio è nuovo.

---

## 6. H5 — I punti di esclusione: **falsificata nei numeri**

`DViewPoint.newVP` (`viewpoint.ts:38`) è effettivamente la sola via di creazione, con **7**
chiamanti: `irDemoFixture.ts:129`, `ProjectEditor.tsx:1193`, `examples/StateMachine/views/index.ts:17`
e `:77`, `view.tsx:1866` (la duplicazione), `redux/store.tsx:246` (il seeding di `Default`), più la
definizione. Ma i punti di **esclusione** non sono uno per voce:

| Cosa va escluso | `file:riga` | Nota |
|---|---|---|
| **Creazione** da «New viewpoint» | `ProjectEditor.tsx:1192` (`handleCreateViewpoint`) | Il dialogo offre i cinque `typeOptions`; basta non aggiungere il valore nuovo alla lista del dialogo. **Nessuna guardia da scrivere** se il tipo nuovo non entra in `typeOptions` (`ViewpointProperties.tsx:24-30`) né nel dialogo. |
| **Creazione** dal segmented del rail | `ViewpointProperties.tsx:41-48` | Vedi §5.2(a): qui il rischio è il **contrario**, declassare il singleton. |
| **Duplicazione** — dashboard di progetto | `ProjectEditor.tsx:1184-1186` (`handleDuplicateViewpoint`) | |
| **Duplicazione** — Dashboard | `Dashboard.tsx:491` (`action={e => vp.duplicate()}`) | Oggi **non** ha nemmeno il `disabled` che ha la delete accanto. |
| **Duplicazione** — motore | `view.tsx:1866` | `get_duplicate` chiama `DViewPoint.newVP(...Copy)`. Guardia ultima ratio, non la prima. |
| **Cancellazione** — dashboard di progetto | `ProjectEditor.tsx:1188-1190` (`handleDeleteViewpoint`) | |
| **Cancellazione** — Dashboard | `Dashboard.tsx:497-498` | Ha già `disabled={Defaults.isSystemViewpoint(vp.id)}`: il punto dove aggiungere il nuovo predicato. |
| **Picker delle sintassi** | `Toolbar.tsx:270` | Il filtro `!Defaults.isSystemViewpoint(ptr)` va esteso. |
| **Apertura sul canvas** | — | **Nessun punto da toccare**: `openViewpoint` (`DockManager.tsx:246`) non apre il canvas, e `activateViewpoint` è raggiungibile solo dal picker (già escluso) e da `EditorSwitch.tsx:93`, che rilegge un id salvato. |
| **Megamodello** | `MegamodelView.tsx:153` | Stesso filtro da estendere. |
| **Sidebar** | `TreeViewContent.tsx:2040-2051` | Va **incluso**, ma in una sezione propria (§2.2). |

La `ViewpointNode` della sidebar (`TreeViewContent.tsx:1577-1586`) espone **solo** «Add view»:
duplicazione e cancellazione dei viewpoint non passano di lì. Sono i `SubViewItem`
(`:1449-1465`) ad avere Duplicate/Delete, e quelli agiscono sulle **view**, non sul viewpoint:
per il singleton diventeranno «togli la personalizzazione di questa classe», che è coerente con
R-DMV-5 (la view svuotata si pota e la classe sparisce).

**Consiglio di forma**: l'esclusione va scritta **una volta**, come `isDataManagerViewpoint`
(§2.4), e chiamata nei 6 punti che filtrano. Copiare `getViewpointType(vp) === 'dataManager'`
in sei posti è esattamente il pattern che `Defaults.isSystemViewpoint` esiste per evitare
(«so the exclusion has one definition and not two», `MegamodelView.tsx:36`).

---

## 7. H6 — `pruneForm`: **confermata a metà**

`FormAuthoringBody.tsx:126-131`, verbatim:

```typescript
function pruneForm(next: FormSpec): FormSpec | undefined {
    const out: FormSpec = { ...next };
    if (out.widgets && Object.keys(out.widgets).length === 0) delete out.widgets;
    if (out.features && Object.keys(out.features).length === 0) delete out.features;
    return Object.keys(out).length === 0 ? undefined : out;
}
```

Pota solo `widgets` e `features`. Le tre chiavi di R-VP-8 (`order`, `labels`, `hidden`,
`irTypes.ts:266-285`) **non sono potate**: un `order: []` o un `labels: {}` lasciato da un autore
resterebbe nel salvato per sempre (R-B9, nessun VersionFixer per l'IR).

**Ma la simmetria con `basic` va rispettata.** Il commento a `:120-123` dice, verbatim:

> `basic: []` is NOT pruned, and that asymmetry with `widgets`/`features` is the point:
> an empty map means "no override", which is the same thing as an absent map, while an
> empty `basic` is a DECLARED answer ("nothing in Basic"), while absent means the
> heuristic instead.

Applicando lo stesso criterio: `order: []` = nessun ordine = identico ad assente (R-VP-13 dice
che i non citati seguono nell'ordine di oggi); `labels: {}` = nessuna label = identico ad
assente; `hidden: []` = niente nascosto = identico ad assente (R-VP-8: «a feature is hidden only
when listed here»). **Tutte e tre sono potabili**, `basic` resta l'eccezione.

**Dove H6 si rompe**: `ManagerSpec` **non sta dentro `FormSpec`**. È un fratello, sul
`NodeViewIR` — `irTypes.ts:436` (`VertexViewIR`) e `:471` (`GraphVertexViewIR`):

```typescript
manager?: ManagerSpec;
```

`pruneForm` prende e restituisce un `FormSpec` e non vede quel livello. Per potare
`manager: { columns: [] }` (o `manager: {}`) serve **una seconda funzione**, allo stesso livello di
`withoutViewWidget` (`widgetRenderer.ts:129`), che opera sull'ir. Non è un'estensione di
`pruneForm`: è un secondo potatore, e va scritto sapendo che ce ne sono già **due**
restatement dei criteri di `pruneForm` in giro (`widgetRenderer.ts:115-124` e
`jjform/widgetValue.ts:20-40`), entrambi con un test che ne impedisce la deriva. Un terzo va
aggiunto con la stessa cura o, meglio, evitato tenendo il potatore dell'ir in **un solo** posto.

---

## 8. Materializzazione (R-DMV-6) e migrazione

### 8.1 Nessuna migrazione serve

Verificato su `VersionFixer.tsx`: l'ultima migrazione è `['2.227 -> 2.228']` (`:1196`), e
`highestVersion` è calcolato dai nomi dei metodi (nessuna costante da bumpare, `CLAUDE.md` §3.9).
Un progetto salvato **senza** il singleton si apre identico perché:

- `viewpointType` è opzionale (`view.tsx:221`) e `getViewpointType` deriva dai booleani;
- `formTheme` è opzionale, con «absent is a value» dichiarato a `view.tsx:216-220`;
- `ManagerSpec` e `FormSpec` sono additivi e senza VersionFixer per costruzione (R-B9,
  `irTypes.ts:315-317`);
- il default implicito di R-VP-4 copre tutto: `resolveManagerSpec` restituisce `NOTHING`
  (`managerViews.ts:41`) quando non c'è indice, e `orderColumns` restituisce le colonne
  invariate quando `spec?.columns` è assente (`instanceTable.ts:135-136`).

Il gate corrispondente in Fase 2 è **negativo**: aprire un progetto salvato e verificare che il
singleton **non** venga creato finché nessuno scrive.

### 8.2 Qual è la prima scrittura, e chi crea cosa

Due candidate, e la scelta cambia il codice:

- **Form theme** (`ViewpointProperties.tsx:67-70`): scrive `formTheme` sul **viewpoint**. Prima
  scrittura ⇒ serve il `DViewPoint`, **non** una view di classe.
- **Un widget per campo**: scrive `form.widgets` su una **view di classe** ⇒ servono entrambi.

Quindi la materializzazione ha **due gradini**, e il secondo implica il primo:

```
(1) il DViewPoint singleton      → DViewPoint.newVP(name, cb, true, id?)  [viewpoint.ts:38]
(2) la view di classe dentro esso → DViewElement.new2(name, '', dVp, undefined, true)
                                    [il pattern di createBlankViewInViewpoint, lastViewpoint.ts:209]
```

`Constructors.DViewPoint()` (`classes.ts:1271-1279`) aggancia il nuovo viewpoint al progetto con
`this.setExternalPtr(project.id, 'viewpoints', '+=')`, quindi entra in `LProject.viewpoints` e —
via il reducer (`reducer.ts:464-467`) — nella root `state.viewpoints`. Entrambe le liste da cui
va poi escluso (§6).

**Cosa vede il rail prima che esista**: il singleton non è selezionabile finché non c'è. Due
uscite possibili, da decidere (Q4): (i) la voce nella sidebar esiste sempre, con lo stato vuoto
«All classes use the type-derived defaults» del memo, e la prima scrittura la materializza;
(ii) la voce compare solo dopo. La (i) è quella che il memo descrive («Stato vuoto: ...»), e
richiede che la sezione della sidebar sia resa anche con il singleton assente.

**Attenzione al TRANSACTION** (`CLAUDE.md` §3.3): `newVP` e `new2` aprono ciascuno una
TRANSACTION interna. La creazione dei due gradini **non** va avvolta in una TRANSACTION esterna.
Il codice esistente lo rispetta già (`handleCreateViewpoint`, `createBlankViewInViewpoint`) e la
Fase 2 deve fare lo stesso. Non è critical zone — nessuno di questi file è in §3.1 — ma la regola
sui creator annidati vale ovunque.

---

## 9. Il nome della chiave delle colonne (R-DMV-3)

**Proposta: `table`.** Motivazioni misurate:

1. **`columns` è già occupato con un altro significato.** `irTypes.ts:400`:
   `columns?: CompartmentColumns` dentro `structure.compartment` — le colonne di griglia di un
   compartimento del nodo. Due `columns` a livelli diversi dello stesso ir, uno «colonne della
   tabella del manager» e uno «colonne della griglia del compartimento», sono la definizione di
   una collisione di vocabolario. `grep -rnE "^\s*columns\??:"` dà 7 occorrenze, di cui
   `irTypes.ts:344` (dentro `ManagerSpec`) e `:400` (il compartimento).
2. **`table` è libero**: `grep -rnE "^\s*table\??:"` → **0 occorrenze** in `frontend/src`.
3. `table` nomina **cosa** la chiave descrive (la tabella), non **chi** la legge (il manager):
   è esattamente l'obiezione del memo §1 («il nome della chiave, `manager`, nomina un componente
   della UI e non un concetto del linguaggio»).
4. `ManagerSpec` diventerebbe `TableSpec`, e `resolveManagerSpec` → `resolveTableSpec`. Coerente
   con `FormSpec`/`ShapeSpec`, che nominano la resa e non il suo host.

**R-B9 verificata**: nessun progetto porta ancora la chiave.
`command grep -rl "manager" frontend/src/examples/ frontend/src/__tests__/fixtures/` → exit 1
(nessun match); positivo di controllo sullo stesso comando e sugli stessi path con `viewpoint` →
exit 0. Case-insensitive, i soli due file che matchano `manager` sono
`examples/StateMachine/M2/index.ts:29` e `examples/RowViewSmoke/index.ts:44,73,456`, e in tutti e
quattro il match è l'identificatore `DockManager`. **La chiave si può ancora rinominare.**

**Occorrenze da rinominare** (conteggio per file, pattern `manager\b` incluse le prose):

| File | Occorrenze |
|---|---|
| `viewpoint/ir/irTypes.ts` | 11 |
| `viewpoint/ir/managerViews.ts` | 7 (più il nome del file e del modulo) |
| `abstract/tabs/InstanceManagerTab.tsx` | 16 |
| `viewpoint/ir/__tests__/managerViews.test.ts` | 22 |
| `abstract/tabs/instanceTable.ts` | 1 |
| `abstract/tabs/__tests__/instanceTable.test.ts` | 1 |

Non tutte sono la chiave: molte sono prosa che parla del Data Manager come componente, e va
lasciata. Il rinomino tocca la chiave dell'ir (`manager?:` in due punti di `irTypes.ts`), il tipo
`ManagerSpec`, la funzione `resolveManagerSpec`, il suo file, il parametro `spec` di
`orderColumns`, e i due test. **Regola 2 di `CLAUDE.md`**: è un rinomino di identificatori
esistenti, quindi va **chiesto nel prompt**, non fatto d'iniziativa. È il senso della domanda Q1.

---

## 10. Collisioni degli identificatori proposti

`command grep -rn <id> frontend/src --include="*.ts" --include="*.tsx"`, conteggio righe:

| Identificatore | Occorrenze | Verdetto |
|---|---|---|
| `DATA_MANAGER_VIEWPOINT` | 0 | libero |
| `dataManagerViewpoint` | 0 | libero |
| `isDataManagerViewpoint` | 0 | libero |
| `Pointer_ViewPointDataManager` | 0 | libero |
| `data_manager` | 0 | libero |
| `isBuiltin` | 0 | libero |
| `builtin` | 55 | **occupato**, ma tutto in JjEL/JjTL/JjScript («builtin functions»): nessuna collisione semantica con i viewpoint. Da evitare comunque come nome per non sovraccaricare la parola. |
| `table` come chiave ir | 0 | libero (§9) |
| `TableSpec` | 0 (non misurato separatamente; `ManagerSpec` è 11 in `irTypes` + i test) | da verificare in Fase 2 prima del rinomino |

---

## 11. Test a rischio

| Test | Cosa asserisce | Rischio |
|---|---|---|
| `editor-v2/__tests__/dataManagerPicker.test.ts` | 39 `it`, quasi tutti su **testo sorgente** di `Toolbar.tsx`. `:171-176` il ramo del sentinel; `:192-195` letteralmente `'}, [modelId]);'` | **Alto** se cambiano le deps di `handleViewpointChange`; **nullo** per un'aggiunta dentro il ramo del sentinel che non nomini `activateViewpoint`, `TabDataMaker`, `InstanceManagerTab`, `closeTab` |
| `editors/viewpoint/properties/__tests__/viewpointThemeHint.test.ts` | `:80-84`: `ViewpointProperties.tsx` non deve contenere `LProject.getProject`, `viewpoints`, `_lastSelected` | **Alto** se l'editor per classe finisce dentro quel file. Nullo con un componente separato (§5.3) |
| `viewpoint/ir/__tests__/managerViews.test.ts` | 22 occorrenze della chiave `manager` in fixture e asserzioni | **Certo** se si rinomina la chiave (§9): il test va aggiornato **nello stesso commit** |
| `abstract/tabs/__tests__/instanceTable.test.ts` | `orderColumns` con `ManagerSpec` | **Basso**, 1 occorrenza |
| `viewpoint/ir/__tests__/ir.test.ts`, `irMarked.test.ts`, `authoring/__tests__/edgeAuthoring.test.ts` | chiamano `getIRIndex(state, sig)` a 2 argomenti, 38 siti | **Nullo** se il parametro è opzionale e in terza posizione (§4.4) |
| `abstract/tabs/instanceManager10*.test.ts` (8 file) + `instanceManagerFl6`, `instanceManagerOutline`, `instanceManagerIconInherit`, `instanceManagerModel`, `egoDiagram` | nessuno cita `computeIRSignature`, `getIRIndex`, `state.viewpoint` o `resolveManagerSpec` (grep: 0 righe) | **Basso**: sono su altre superfici del manager |
| Sidebar | **nessun test**: `frontend/src/components/TreeViewSidebar/__tests__/` non esiste | La sezione nuova nasce **senza rete**. Vale come rischio, non come assenza di lavoro |

---

## 12. Proposta di affettatura della Fase 2

Ogni slice sotto i 5 file (regola 19) salvo deroga dichiarata. L'ordine è per dipendenza: ogni
slice è committabile e verificabile da sola.

**Slice A — il tipo e il predicato** (3 file + 1 test)
`viewpoint.ts` (valore nuovo di `ViewpointType`, `isDataManagerViewpoint`), `Toolbar.tsx`
(filtro), `MegamodelView.tsx` + `Dashboard.tsx` (filtro / `disabled`). Nessuna UI nuova, nessun
singleton ancora creabile: l'esclusione arriva **prima** della cosa da escludere, così non esiste
mai una finestra in cui il singleton compare dove non deve. **Deroga regola 19 probabile** (4
file + test): da dichiarare.
*Verifica*: nessun cambiamento visibile; il progetto si apre identico.

**Slice B — l'indice parametrizzato** (2 file + 2 test)
`irResolveCore.ts` (parametro opzionale su `computeIRSignature` e `getIRIndex`),
`useIRFormView.ts` (parametro opzionale propagato nei tre punti). Nessun chiamante cambia
comportamento: il default è l'attivo.
*Verifica*: canvas, manager e drawer identici; suite IR verde.

**Slice C — la nascita e la lettura del manager** (3-4 file)
Il creatore del singleton (dove: vedi Q3), `InstanceManagerTab.tsx:1523` che legge dal singleton,
`IRForm.tsx:214` che legge il tema dal singleton quando `host === 'manager'`.
*Verifica*: con il singleton assente, tabella e drawer identici a oggi (R-VP-4); creato a mano il
singleton con una view di classe, le colonne seguono lui e non il viewpoint attivo.

**Slice D — il rail del singleton** (2-3 file nuovi + `Info.tsx`)
`DataManagerViewpointPanel.tsx` nuovo: nome, Form theme senza hint, **senza** il segmented Type;
selettore di metaclasse; tabella feature → widget su `rowsForMetaclass` + `offeredOverrides`;
materializzazione alla prima scrittura. `Info.tsx` dispatcha su `isDataManagerViewpoint`.
*Verifica*: R-DMV-4 per intero, più il controllo negativo che il singleton non appaia nel picker.

**Slice E — la sidebar** (1-2 file)
Sezione «Data Manager» in `TreeViewContent.tsx`, con le sole classi personalizzate, le feature
toccate e lo stato vuoto; esclusione del singleton da `syntaxVps`/`validationVps`/`otherVps`.
*Verifica*: R-DMV-5.

**Slice F — la potatura** (2 file + test)
`pruneForm` esteso a `order`/`labels`/`hidden` (non a `basic`); potatore separato per la chiave
delle colonne sull'ir; la view svuotata sparisce dall'albero.

**Slice G, opzionale e separata — il rinomino `manager` → `table`** (6 file)
Solo se Alfonso lo ratifica (Q1). Da sola, senza altro nel commit: è un rinomino puro e va
potuto revertire.

---

## 13. Rischi

| # | Rischio | Gravità | Mitigazione |
|---|---|---|---|
| R1 | Il singleton nasce o finisce con `isExclusiveView: false` e le sue view si applicano come decorative su ogni canvas classico (§2.3) | **Alta** — regressione visiva silenziosa su tutti i progetti | Creare senza passare dallo switch di `handleCreateViewpoint`; togliere il segmented Type dal rail del singleton; smoke esplicito su un progetto con canvas classico |
| R2 | Il rinomino `manager` → `table` fatto a metà: la chiave nell'ir cambia, un lettore no | Alta | Slice G isolata, 22 asserzioni del test come rete, `grep` finale a 0 |
| R3 | `useIRFormView` dimenticato: la tabella legge dal singleton e il drawer dall'attivo | Media — incoerenza fra due metà della stessa schermata | Slice C tocca i due (tre, col tema) punti insieme |
| R4 | La sezione nuova della sidebar nasce senza test (§11) | Media | Un test di sorgente sul modello dei `instanceManager10*` |
| R5 | Il singleton entra nel picker o nel megamodello per una lista non censita | Media | Il predicato unico di §2.4; grep di `isSystemViewpoint` come mappa dei punti che già filtrano (6 siti) |
| R6 | La materializzazione avvolta in una TRANSACTION esterna (creator annidati, §8.2) | Media | `CLAUDE.md` §3.3; seguire `handleCreateViewpoint` e `createBlankViewInViewpoint` |
| R7 | `indexCache` con due viewpoint indicizzati: il ciclo di vita del CSS (§4.4) è per-viewpoint per lettura, non per esecuzione | Bassa | Un test sulla slice B |

---

## 14. Domande aperte per Alfonso

**Q1 — Il rinomino `manager` → `table` si fa?** §9 dice che si può ancora (R-B9 verificata, nessun
progetto la porta) e perché conviene (`columns` è occupato da `structure.compartment.columns`).
È un rinomino di identificatori esistenti: regola 2 impone che sia il prompt a chiederlo. Se sì,
slice G separata; se no, `manager` resta e il memo §3 va aggiornato di conseguenza.

**Q2 — Il valore del tipo: `'dataManager'` o `'data_manager'`?** L'union mescola già le due grafie
(`editor_behavior` vs gli altri). `'dataManager'` si allinea al vocabolario già ratificato del
picker (`DATA_MANAGER_OPTION_VALUE`, `isDataManagerOption`).

**Q3 — Id fisso o generato?** `newVP` accetta un id esplicito (`viewpoint.ts:38`). Un
`Pointer_ViewPointDataManager` fisso rende il ritrovamento banale (una lettura da `idlookup`) e
allinea il singleton al precedente di `Pointer_ViewPointDefault`; un id generato obbliga a
cercarlo per tipo scorrendo `state.viewpoints`. L'id fisso ha un contro: due progetti aperti in
sequenza nella stessa sessione condividerebbero la chiave dell'indice — la signature include l'id,
quindi la cache potrebbe servire l'indice del progetto precedente. **Non ho misurato** se
`indexCache` sopravvive al cambio di progetto: se sì, l'id generato è più sicuro.

**Q4 — La voce «Data Manager» nella sidebar esiste anche quando il singleton non esiste?** Il memo
§2 descrive uno stato vuoto («All classes use the type-derived defaults»), che implica di sì.
Confermare: cambia se la sezione si rende con il singleton assente.

**Q5 — Nel rail del singleton, `theme`/`labelPlacement` per-view si offrono?** `FormAuthoringBody`
li porta, ma sul singleton duplicherebbero il «Form theme» del viewpoint a un gradino diverso
della cascata. Proposta: **no** nella slice D, solo la tabella dei widget.

**Q6 — Chi apre il rail sul singleton?** §3 dice che il meccanismo è
`SetRootFieldAction('_lastSelected', {view: singletonId})`. Da dove: la voce «Data manager» del
picker (che oggi apre la tab del manager e basta), la sezione della sidebar, o entrambe? Se il
picker fa **due** cose — apre la tab e seleziona nel rail — va detto, perché oggi ne fa una.

---

## 15. Cosa questa discovery **non** ha misurato

Dichiarato perché non venga letto come silenzio:

- **Non ho eseguito nulla.** Nessun `npm run test`, nessun dev server, nessuna verifica a schermo.
  Ogni «funziona così» qui è lettura di sorgente, e il §5 di `CLAUDE.md` dice cosa vale una lettura
  di comparatore senza esecuzione.
- **`indexCache` attraverso un cambio di progetto** (Q3): non misurato.
- **Il ciclo di vita del CSS con due viewpoint indicizzati** (§4.4, R7): dedotto dalla condizione
  `oldIdx.viewpointId === vp`, non eseguito.
- **`TableSpec`** come identificatore: non grepato separatamente.
- **Le 55 occorrenze di `builtin`**: campionate (12 righe lette), non lette tutte. La conclusione
  «tutte in JjEL/JjTL/JjScript» è su quel campione.
- **`ViewpointNode` e i menu contestuali del canvas**: ho letto la sidebar e le due dashboard.
  Se esiste un terzo posto da cui si duplica o si cancella un viewpoint, non l'ho trovato — e
  «non l'ho trovato» qui vale come tale, non come «non esiste».
