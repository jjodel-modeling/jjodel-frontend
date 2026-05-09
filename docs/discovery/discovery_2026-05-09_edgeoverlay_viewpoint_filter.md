# Discovery — EdgeOverlay viewpoint filter (2026-05-09)

Discovery read-only sulle 4 incognite per il filtro viewpoint del Bug A. Niente modifiche al codice.

---

## D1. Schema del campo `viewpoint` su DViewElement

**Tipo**: `viewpoint!: Pointer<DViewPoint>` — singolo Pointer (string id), **non** array, non oggetto, non name.
Definito in `frontend/src/view/viewElement/view.tsx:232`.

**Quando può essere null/undefined**: sostanzialmente **mai per istanze valide**. Il costruttore `Constructors.DViewElement` (classes.ts:1205) garantisce che il campo sia sempre popolato secondo questa cascata:

```typescript
if (!vp) vp = LProject.getProject()?.activeViewpoint.id || Defaults.viewpoints[0];
if (vp !== 'skip') this.setPtr('viewpoint', vp);
```

- Provided `vp` argument vince
- Altrimenti `LProject.getProject().activeViewpoint.id`
- Altrimenti `Defaults.viewpoints[0]` = `'Pointer_ViewPointDefault'`
- Sentinel `vp === 'skip'`: skip set (usato internamente, non da UI)

Per istanze di **DViewPoint** (che `extends DViewElement` — TypeScript subclass): il campo è settato a self-reference in `viewpoint.ts:43`:
```typescript
c.thiss.viewpoint = c.thiss.id;
```

**Storia**: il campo `viewpoint` predates `father`. Migration in `VersionFixer.tsx:421` (vecchia versione) ha copiato `viewpoint → father` per popolare il nuovo schema:
```typescript
for (let c of (s.viewelements).map(p=> this.d(p, s))) { c.father = c.viewpoint; }
```
Quindi tutte le istanze, anche legacy, hanno `viewpoint` valorizzato.

**Caveat critico — D vs L disaccoppiati**: il **getter L-layer** `get_viewpoint` (view.tsx:1392-1402) NON legge `c.data.viewpoint`! Walka invece la `father` chain UPWARDS finché trova un nodo senza padre, e ritorna quello. La sincronizzazione tra D-field `viewpoint` e L-computed `viewpoint` è mantenuta da `set_father` (view.tsx:1421):
```typescript
if (data.viewpoint !== dfather.viewpoint) SetFieldAction.new(id, "viewpoint", dfather.viewpoint, '', true);
```
**Implicazione per il filtro**: `EdgeOverlay` legge `state.idlookup[k]` (D-layer), quindi accede al **campo persistito** `viewpoint` — il valore corretto per il filtro. Niente walk del father chain necessario.

---

## D2. Path graphid → viewpoint attivo

Il `graphid` **non serve** per risolvere il viewpoint attivo: il progetto è un singleton derivato dall'URL.

**Path canonico** (mirror del pattern già usato in `EdgeOverlay.tsx` con `(window as any).LPointerTargetable`):
```typescript
const w: any = window;
const LProject = w.LProject;                    // already exposed as global
const activeVpId: string | undefined = LProject?.getProject?.()?.activeViewpoint?.id;
```

`LProject.getProject()` (classes.ts:3024-3026) è singleton URL-derivato:
```typescript
static getProject(): LProject {
    return LProject.wrap(U.getProjectID_URL()) as LProject;
}
```

Il getter `activeViewpoint` (classes.ts:3343-3345) ha fallback sicuro:
```typescript
return LViewPoint.fromPointer(context.data.activeViewpoint || Defaults.viewpoints[0]);
```

Quindi `activeVpId` è **sempre risolvibile** quando un progetto è caricato (e EdgeOverlay viene mountato solo dentro `ModelTab`, che richiede un progetto attivo).

**Path alternativi** (ispezionati ma non raccomandati per la Fase B):

1. **Root state field** `state.viewpoint` (selectors.ts:104): scritta da `activateViewpoint()` in `lastViewpoint.ts:56` via `SetRootFieldAction.new('viewpoint', viewpointId, '', true)`. **Sconsigliato** — può essere stringa vuota (`''`) all'init del progetto, e nessun fallback come `activeViewpoint`. Inoltre serve principalmente a `EditorSwitch` per il toggle split view (commento esplicito in `lastViewpoint.ts:38-39`).

2. **Via project entry diretto**: `state.idlookup[U.getProjectID_URL()].activeViewpoint` — funziona ma duplica la logica già fattorizzata in `LProject.getProject().activeViewpoint`.

3. **Risalita graphid → project**: tecnicamente possibile (graph → DGraph.model → DModel → project via `LProject.getProject()`), ma ridondante perché il progetto è singleton.

**Sincronizzazione D vs L state**: `activateViewpoint()` scrive in entrambe le sorgenti (project.activeViewpoint + state.viewpoint root) nello stesso flusso, ma con due dispatch separati senza TRANSACTION wrapper. Per il filtro, la sorgente di verità è `LProject.getProject().activeViewpoint.id` perché ha il fallback default.

**File:riga rilevanti**:
- `frontend/src/joiner/classes.ts:3024-3026` — `LProject.getProject()`
- `frontend/src/joiner/classes.ts:3343-3345` — `get_activeViewpoint` con fallback
- `frontend/src/joiner/classes.ts:2923` — `activeViewpoint: Pointer<DViewPoint, 1, 1>` su DProject
- `frontend/src/utils/lastViewpoint.ts:46-57` — `activateViewpoint()` doppio write
- `frontend/src/components/abstract/tabs/ModelTab.tsx:47` — mount point di EdgeOverlay

---

## D3. View globali / senza viewpoint

**Conclusione**: **nessuna DV con `isEdge=true` esiste senza viewpoint** (o destinata a tutti i viewpoint).

Tutti i path di creazione di una `DViewElement` settano sempre il campo `viewpoint`:

| Path di creazione | Sorgente del viewpoint |
|-------------------|------------------------|
| `DViewElement.new2()` (view.tsx:291-298) | `father.viewpoint \|\| Defaults.viewpoints[0]` |
| `DViewElement.newDefault()` (view.tsx:300-346) | parent = active VP, o `Pointer_ViewModel` (in `Pointer_ViewPointDefault`) |
| `Constructors.DViewElement` direct (classes.ts:1205) | active VP id, o `Defaults.viewpoints[0]` |
| Workbench creation (`createViewInWorkbench`, lastViewpoint.ts:104-179) | `resolveParentViewpoint()` → last edited / active / default |
| InfoData.tsx UI dropdown "Viewpoint" (riga 297-313) | scrive su `father` (line 306), che a cascata aggiorna `viewpoint` via `set_father` |

**Default edge views — clarification importante**: `Defaults.views` (Defaults.ts:5-30) elenca 23 view di default, di cui 6 con prefisso `Pointer_ViewEdge*` (Association, Dependency, Inheritance, Aggregation, Composition, EdgePoint, Anchors). **Nessuna di queste setta `isEdge=true`**: usano il meccanismo legacy `appliableTo === 'Edge'` (refEdges/extEdges), distinto dal nuovo schema L2 `isEdge`. Verifica in `redux/defaults/views.ts`:
- `grep "isEdge" frontend/src/redux/defaults/views.ts` → 0 occorrenze
- `appliableTo = 'EdgePoint'` (riga 752 di views.ts) — schema legacy

**Migration L2** (VersionFixer 2.212→2.213, riga 645-662): aggiunge `isEdge: false`, `edgeSource: ''`, `edgeTarget: ''` a tutte le DViewElement esistenti. **Nessuna view diventa `isEdge=true` per migration.**

**Quindi, lo schema L2 `isEdge=true` è 100% user-opt-in via InfoData.tsx (riga 110-117, 140)**, e ogni DV creata da quel flusso eredita un `viewpoint` valorizzato.

**Caso edge — viewpoint nel viewpoint corrente**: l'utente che crea una "View for Edge" con `isEdge=true` mentre il viewpoint `concrete` è attivo, ottiene `view.viewpoint === '<id-di-concrete>'`. Cambiando viewpoint a `abstract syntax`, quella DV non dovrebbe più apparire — è esattamente il bug A.

**Enumerazione casi possibili**:
```
DV con isEdge=true creata via InfoData (caso utente) → viewpoint = '<Pointer del DViewpoint scelto>' (string Pointer)
DV con isEdge=true creata via Apply suggestions banner (L2.x.1) → idem (heredita da view che era in editing)
DV con isEdge=true legacy/migration → NON esiste (migration 2.212→2.213 setta solo isEdge=false)
DV con isEdge=true e viewpoint=undefined → NON ESISTE (costruttore garantisce sempre un valore)
DV con isEdge=true creata via createViewInWorkbench → viewpoint del workbench corrente (resolveParentViewpoint)
```

**Implicazione per il filtro**: il filtro `view.viewpoint === activeVpId` non spegne nessuna edge default, perché **non esistono edge default** nel nuovo schema isEdge. Le edge "default" del legacy schema (refEdges via `appliableTo='Edge'`) sono renderizzate da un altro pipeline (graphElement.tsx, non EdgeOverlay).

---

## D4. Viewpoint inheritance

**No viewpoint-to-viewpoint inheritance**. I viewpoint sono i ROOT di un albero di view collegate via `father` chain — non esiste un meccanismo `viewpoint extends otherViewpoint`.

**Evidenze**:
- `DViewPoint extends DViewElement` (viewpoint.ts:24) è subclass TypeScript, **non** semantica di dominio.
- DViewPoint non ha campi `parent`, `extends`, `inheritsFrom`, `imports` — verificato con grep.
- DViewPoint hanno `father?: undefined` (sono al top dell'albero) e `viewpoint = self.id` (self-reference set in `newVP`, viewpoint.ts:43).
- Il getter `LViewElement.get_viewpoint` (view.tsx:1392-1402) walka SOLO la `father` chain UPWARDS, **fino al primo nodo senza padre**. Niente cross-viewpoint hop.
- Il dropdown "Parent view" in InfoData.tsx:316-329 filtra esplicitamente le opzioni per appartenenza al viewpoint corrente:
  ```tsx
  view.allPossibleParentViews.filter(v => v.viewpoint?.id === vpid)
  ```
  L'inheritance esiste solo **fra view nello stesso viewpoint** — non fra viewpoint distinti.

**Conclusione operativa**: il filtro semantico è `view.viewpoint === activeVpId` — equality semplice, niente chain traversal. La risposta a D4 chiude il dubbio sollevato dall'img 5 della chat (dropdown "Parent view"): si riferisce alle **view**, non ai viewpoint.

---

## Findings collaterali

1. **Duplicazione potenziale di edgeViews da viewpoint diversi**: il bug A potrebbe manifestarsi anche se due viewpoint distinti contengono entrambi una DV `isEdge=true` per la stessa metaclass. Senza filtro, `findApplicableEdgeView` ritorna la prima trovata in `idlookup` iteration order. Il filtro per viewpoint risolve questo nondeterminismo come effetto collaterale.

2. **`appliableToClasses=['DObject']` — wildcard Pass 2 di `findApplicableEdgeView`**: il commento riga 369 cita `lastViewpoint.ts` come sorgente di view auto-create con `['DObject']` wildcard. Verifica: `createViewInWorkbench` (lastViewpoint.ts:124) fa esattamente questo per `case 'DClass'`. Ma queste view sono **legate a un viewpoint** (line 153-163: `father: dViewpoint`), quindi il filtro per viewpoint le include/esclude correttamente.

3. **DViewPoint stessi sono `DViewElement` con `className === 'DViewPoint'`**, non `'DViewElement'`. Il loop di scoperta `edgeViews` filtra `className === 'DViewElement'` (EdgeOverlay.tsx:145), quindi i viewpoint stessi non entrano. Tuttavia, se un futuro bug introducesse `className === 'DViewElement'` con `viewpoint = self.id` (errato), il filtro `view.viewpoint === activeVpId` lo includerebbe quando l'utente è su quel viewpoint — comportamento ragionevole.

4. **`state.viewpoint` root field può essere stringa vuota (`''`)** all'inizializzazione del progetto, prima che `activateViewpoint()` sia chiamato la prima volta. Se la Fase B usasse `state.viewpoint` come sorgente, il filtro spegnerebbe TUTTE le edge view in quella finestra temporale. **Conferma raccomandazione di usare `LProject.getProject().activeViewpoint.id` (che ha fallback)** invece di `state.viewpoint`.

---

## File ispezionati

- `frontend/src/components/edgeOverlay/EdgeOverlay.tsx` (lettura completa, 640 righe)
- `frontend/src/view/viewElement/view.tsx:140-450, 1376-1470` — `DViewElement`/`LViewElement` definitions, `viewpoint`/`father` getters
- `frontend/src/view/viewPoint/viewpoint.ts` (lettura completa)
- `frontend/src/joiner/classes.ts:1060-1230` — Constructor `DViewElement`
- `frontend/src/joiner/classes.ts:2920-2950, 3020-3460` — DProject/LProject, activeViewpoint getter
- `frontend/src/joiner/classes.ts:1968-1980` — `LPointerTargetable.project` getter
- `frontend/src/utils/lastViewpoint.ts` (lettura completa, 180 righe)
- `frontend/src/redux/VersionFixer.tsx:410-440, 630-710` — migrations su viewpoint/isEdge
- `frontend/src/common/Defaults.ts` (lettura completa, 122 righe)
- `frontend/src/components/editors/views/data/InfoData.tsx:1-330` — UI Viewpoint/Parent view dropdowns
- `frontend/src/components/abstract/tabs/ModelTab.tsx` — mount point EdgeOverlay
- `frontend/src/redux/selectors/selectors.ts:85-138` — `getViewpoint`/`getViewpoints`
- `frontend/src/redux/defaults/views.ts:1-760` (selettivo) — verifica assenza isEdge nei default

---

## Bozza filtro (NON applicare)

**Insertion point in `EdgeOverlay.tsx`**: dentro `buildSelectorResult`, dopo l'early-return `no-graph` (riga 138) e **prima** del loop di scoperta `edgeViews` che inizia a riga 141.

**Pseudo-codice TypeScript**:

```typescript
// Aggiungere dopo riga 138 (post lGraph guard):
const LProject = w.LProject;
const activeVpId: string | undefined =
    (LProject && typeof LProject.getProject === 'function')
        ? LProject.getProject()?.activeViewpoint?.id
        : undefined;

// Modificare il loop a riga 141-150 — aggiungere il pre-filtro per viewpoint:
const edgeViews: any[] = [];
for (const k in state.idlookup) {
    const e = state.idlookup[k];
    if (!e || typeof e !== 'object') continue;
    if (e.className !== 'DViewElement') continue;
    if (e.isEdge !== true) continue;
    if (typeof e.edgeSource !== 'string' || !e.edgeSource) continue;
    if (typeof e.edgeTarget !== 'string' || !e.edgeTarget) continue;
    // === FILTRO VIEWPOINT (nuovo) ===
    if (typeof activeVpId === 'string' && activeVpId !== ''
        && e.viewpoint !== activeVpId) continue;
    // === fine filtro ===
    edgeViews.push(e);
}
```

**Note di implementazione**:
- Il guard `typeof activeVpId === 'string' && activeVpId !== ''` mantiene il comportamento corrente (no-filter) nel caso degenere di `activeVpId` non risolvibile — defensiva, evita di spegnere TUTTO se per qualche ragione il singleton non è ancora montato.
- Confronto `e.viewpoint !== activeVpId`: equality semplice, perché D4 ha confermato no-inheritance. Niente `String.prototype.includes` o set lookup.
- Il debug logging esistente (`code: 'no-edge-views'`, riga 152-160) cattura già il caso "loop scartato perché tutte le edgeViews sono di altri viewpoint" — non serve nuovo exit code in Fase B (può essere aggiunto se utile per tracing fine, opzionale).
- Il selettore è già memoized via `selectorResultEqual` (riga 215-235); il filtro aggiunto cambia solo la cardinalità di `edgeViews` (e quindi degli `edges` finali), che è già parte del signature comparato dal `rectEqual` per posizione.
- `edgePropsEqual` (riga 315) non è impattato — opera per-edge.

**Effetti collaterali attesi (positivi)**:
- Bug A risolto: cambio viewpoint da `concrete` a `abstract syntax` → edge views di `concrete` non più rispondenti al match → no SVG path renderizzato → frecce reference native del nuovo viewpoint visibili senza overlap.
- `findApplicableEdgeView` Pass 2 wildcard `'DObject'`: limitato al viewpoint attivo, riducendo collisioni cross-viewpoint.
- Performance: riduzione lineare del loop di matching nel selector body (cheap iteration in ogni dispatch).

**Effetti collaterali attesi (zero/neutri)**:
- Niente regressione su edge default L1 (refEdges/extEdges via legacy `appliableTo='Edge'`): non passano dal pipeline EdgeOverlay.
- Niente regressione su flow editor v2: EdgeOverlay è mountato solo in ModelTab (classic editor).
- Memoization preservata (`selectorResultEqual`).

**Cose da NON cambiare in Fase B**:
- `findApplicableEdgeView` priority logic (Pass 1 / Pass 2): D2/D3 confermano che nessuna riarchitettura serve, il filtro upstream è sufficiente.
- `useJjomSync.ts`: vincolo architetturale, non toccare.
- Nuovi exit code in `logExit`: opzionale, non bloccante per chiudere il bug.
