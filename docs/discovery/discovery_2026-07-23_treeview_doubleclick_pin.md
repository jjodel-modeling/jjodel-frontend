# Discovery — Doppio click su vista nel tree-view → Properties pinnato

**Data**: 2026-07-23
**Tipo**: discovery read-only (Fase 1) → HARD STOP
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: `2026-07-23 — Doppio click su vista nel tree-view apre Properties pinnato (Fase 1)`
**Layer Impact Report**: not-required (nessun file critical-zone §3.1)

> Nessun file di runtime modificato. Questo documento è l'unico output della Fase 1.
> La Fase 2 parte **solo** dopo go-ahead esplicito di Alfonso.

---

## 0. Obiettivo

Mappare, prima di scrivere codice, (a) come sono gestiti oggi click e doppio click sui nodi
vista del tree-view, (b) come si attiva il pin di Properties e dove vive il suo stato, (c) se
esiste già un canale fra `TreeViewContent` e il meccanismo di pin o se serve crearne uno,
(d) come funziona il ri-targeting del pin, (e) quali guard esistenti vanno rispettati.

---

## 1. File letti (verificati sul working tree, non sui numeri del prompt)

| File | Righe rilevanti |
|------|-----------------|
| `docs/discovery/2026-07-05_properties-pin.md` | intero (design originale del pin) |
| `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` (2305 righe) | 549–572 (`EntityRowProps`), 574–666 (`EntityRow`, riga **626** `tree-row__content onClick`), 1124–1251 (`SubViewItem`), 1154–1166 (`handleClick` vista), 1180–1190 (input di rename), 1257–1363 (`ViewpointNode`), 1285–1297 (`handleClick` viewpoint), 1471–1477 (`TreeViewContentProps`), 1534–1594 (rename state), 1884–1962 (render sezione VIEWPOINTS), 2280 (`selectedElementId`), 2296–2305 (connect + wrapper) |
| `frontend/src/components/editors/PropertiesWithTreeView.tsx` (480 righe) | 187–233 (blocco pin completo), 324–343 (header + bottone pin), 344–349 (`<Info>` wirato), 413 (`<TreeViewContent />`) |
| `frontend/src/components/editors/Info.tsx` (1427 righe) | 1182–1217 (ramo VIEW), 1370–1380 (`OwnProps` con `overrideSelected`/`onInternalNavigate`), 1395–1410 (`mapStateToProps`) |
| `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` | 183 e 241 (secondo e terzo mount di `TreeViewContent`) |
| `frontend/src/redux/action/action.ts` | 319–349 (`Action.fire`), 404–448 (`SetRootFieldAction`) |
| `frontend/src/redux/reducer/reducer.ts` | 1274–1314 (`isRelevantChangeCheck` / `isOnlyTransientTopLevelChange`) |
| `frontend/src/events/registry.ts` | 7–61 (`JjodelEvents`), 98–103 (`SystemEvents`) |
| `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` | 85, 1516, 1627 (le uniche `user-select: none`) |

---

## 2. Click sui nodi vista, oggi

Nel tree i nodi "vista" sono **due componenti distinti**, entrambi nella sezione VIEWPOINTS:

| Componente | Badge | Entità D | Scritto in `_lastSelected` | Riga dispatch |
|------------|-------|----------|----------------------------|---------------|
| `ViewpointNode` | `VP` | `DViewPoint` | `{node:'', view: vp.id, modelElement:''}` | **1288** |
| `SubViewItem` | `v` | `DViewElement` | `{node:'', view: view.id, modelElement:''}` | **1157** |

`SubViewItem` è ricorsivo (sotto-viste annidate: riga 1231) ed è renderizzato solo da
`ViewpointNode` (1343). `ViewpointNode` è renderizzato in 3 punti (1894 Syntax, 1924
Validation, 1945 "other").

`SubViewItem.handleClick` (1154–1166):

```ts
const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        SetRootFieldAction.new('_lastSelected' as any, { node: '', view: view.id, modelElement: '' });
    } catch (err) { console.warn('[TreeView] Failed to select view:', err); }
    onSelect?.();
}, [view.id, onSelect]);
```

`ViewpointNode.handleClick` (1285–1297) è identico modulo `vp.id` e messaggio di warn.
Entrambi sono passati come prop `onClick` a `EntityRow`, che li attacca **solo** al div
`.tree-row__content` (riga 626) — non all'intera riga: il chevron (615–621) e la colonna
`actions` (655) restano fuori.

**Effetto sul Properties**: `Info.mapStateToProps` risolve `view` da `_lastSelected.view`
(1402/1405) e il ramo VIEW (1187) ha precedenza su tutto → `ViewpointProperties` per un VP,
`ViewData` (Monaco: Apply to / Template / Style / Events / Options) per una view.

**Gli altri 7 writer di `_lastSelected` nel file** (fuori scope, da non toccare):
`FeatureRow` 685, `StructuralFeatureRow` 722, `ClassNode` 781, `PackageNode` 873,
`ModelNode` 959, `MetamodelNode` 1038, `TransformationItem` 1395. Tutti scrivono
`modelElement`, mai `view`. Totale 9 siti, coerente con la mappatura del 2026-07-05.

### 2.1 Doppio click: oggi NON esiste, in nessun punto del tree

`grep -rn "onDoubleClick|'dblclick'|\"dblclick\""` su tutto `frontend/src`: **zero occorrenze**
in `TreeViewSidebar/` (sia `.tsx` che `.scss`). Il gesto è completamente libero sui nodi vista
— nessun handler da preservare, nessun conflitto con Monaco/`ViewData`/altro.

Verificato anche il sospetto naturale "il doppio click rinomina la view": **no**.
`startRenameView` (1542) ha **un solo chiamante**, `ViewpointNode.handleAddView` (1309), cioè
il rename inline parte esclusivamente dalla creazione di una nuova view col bottone `+`. Non
esiste oggi alcun modo di rinominare una view esistente dal tree.

`JjodelEvents.SELECT_VIEW_IN_WORKBENCH` (`registry.ts:20`) è una **costante morta**: nessun
dispatch, nessun listener in tutto il codebase. Non c'è quindi una convenzione preesistente
"doppio click su vista = aprila nel workbench" che il nuovo gesto andrebbe a scavalcare.

Precedente stilistico altrove nel progetto: `MegamodelNode.tsx:104–113` usa un
`setTimeout(…, 150)` per disambiguare click e doppio click. **Qui non serve** (§6.1).

---

## 3. Il meccanismo di pin, oggi

Tutto in `PropertiesWithTreeView.tsx`, righe **187–233**. Nessun Redux, nessun context,
nessuna persistenza: **stato React locale del componente**.

```ts
const [pinnedSelected, setPinnedSelected] =
    useState<{ node: string; view: string; modelElement: string } | null>(null);   // 190
const store = useStore();                                                          // 195
const pinnedResolvable = useSelector((state: any) => {                             // 200–205
    if (!pinnedSelected) return false;
    const id = pinnedSelected.modelElement || pinnedSelected.view || pinnedSelected.node;
    if (!id) return true;                       // pin su tripla vuota → non dangling
    return !!state.idlookup?.[id];
});
useEffect(() => {                                                                  // 207–209
    if (pinnedSelected && !pinnedResolvable) setPinnedSelected(null);   // unpin automatico
}, [pinnedSelected, pinnedResolvable]);

const togglePin = useCallback(() => {                                              // 211–222
    setPinnedSelected(prev => {
        if (prev) return null;
        const sel = (store.getState() as any)._lastSelected;   // lettura IMPERATIVA
        return { node: sel?.node || '', view: sel?.view || '', modelElement: sel?.modelElement || '' };
    });
}, [store]);

const handleInternalNavigate = useCallback((sel) => setPinnedSelected(sel), []);    // 226–228
const isPinned = !!pinnedSelected;                                                 // 230
const effectivePin = pinnedSelected && pinnedResolvable ? pinnedSelected : undefined; // 233
```

Consumato a 344–349:
```tsx
<Info mode={mode}
      overrideSelected={effectivePin}
      onInternalNavigate={isPinned ? handleInternalNavigate : undefined} />
```

Il bottone (327–335, classe `properties-panel-pin-btn`) chiama `togglePin`. **È l'unico
chiamante.** `Info.tsx` è già wirato lato ricezione (`OwnProps` 1374–1379,
`mapStateToProps` 1397–1403), esattamente come da design 2026-07-05.

**Risposte alle domande del prompt**:

- *Che tipo di stato imposta?* Non un flag booleano: la **tripla catturata** (`{node, view,
  modelElement}`) oppure `null`. `isPinned` è derivato. La tripla è sia "sono pinnato" sia
  "su cosa".
- *Dove vive?* `useState` locale in `PropertiesWithTreeView`. Effimero (nessun localStorage,
  a differenza di width/visibility che invece sono persistiti).
- *È invocabile programmaticamente dall'esterno?* **No, oggi no.** `togglePin` è un
  `useCallback` interno non esposto: niente ref, niente context, niente listener di eventi,
  nessuna prop. Serve aprire un canale (§4).
- *E comunque `togglePin` non è la primitiva giusta*: è un **toggle** che cattura dallo store.
  Il doppio click ha bisogno di un **set idempotente su una tripla data**, cioè della stessa
  primitiva di `handleInternalNavigate` (`setPinnedSelected(sel)`), non di `togglePin`.

---

## 4. Canale fra `TreeViewContent` e il pin

**Oggi non esiste alcun canale.** `PropertiesWithTreeView` importa e renderizza
`TreeViewContent` (riga 6 e 413) **senza passargli nulla**: `<TreeViewContent />`. Il flusso
informativo è a senso unico e implicito, via Redux `_lastSelected`. Nessun context condiviso
(`TreeViewPanelContext` è usato da entrambi ma espone solo visibilità/pulse/highlight, non il
pin).

Vincolo topologico importante: **`TreeViewContent` è montato in 3 punti**, di cui 2 fuori dal
sottoalbero di `PropertiesWithTreeView`:

| Mount | Contesto | Ha il pin sopra di sé? |
|-------|----------|------------------------|
| `PropertiesWithTreeView.tsx:413` | pannello split (mode `tab`) | **sì** |
| `TreeViewSidebar.tsx:183` | overlay laptop | no |
| `TreeViewSidebar.tsx:241` | sidebar desktop/monitor | no |

### 4.1 Opzione A — prop drilling

`PropertiesWithTreeView` passa `onViewDoubleClick?: (viewId: string) => void` a
`TreeViewContent` (`TreeViewContentProps` 1471–1477 è già `OwnProps` del `connect`, quindi
l'aggiunta è additiva e supportata) → `TreeViewContentComponent` → `ViewpointNode` (3 call
site: 1894, 1924, 1945) → `SubViewItem` (2 call site: 1343, 1231 ricorsivo) → `EntityRow`.

- **Pro**: esplicito, tracciabile, nessun evento globale; nei mount della sidebar la prop è
  assente e il doppio click semplicemente non fa nulla (comportamento definito by design).
- **Contro**: ~6 liste di prop toccate, in componenti `memo` che già trasportano 7 prop di
  rename ciascuno. Diff più largo di quanto la feature richieda.

### 4.2 Opzione B — CustomEvent dal registry (**raccomandata**)

`TreeViewContent` dispatcha su `window` un evento tipizzato; `PropertiesWithTreeView` lo
ascolta e chiama `setPinnedSelected`. È il **pattern canonico del progetto** per UI
cross-cutting (CLAUDE.md §8.7: "CustomEvent dispatcher + local `useState` listener, non
Redux"), già usato in questo stesso file per `TOGGLE_TREE_VIEW` (283–291) e in
`TreeViewContent` per `TRANSFORMATIONS` (1598–1605) e `TREEVIEW_SCROLL` (1608–1620).

- **Pro**: diff minimo (1 costante in `registry.ts`, 1 prop opzionale su `EntityRowProps`,
  1–2 handler nei nodi vista, 1 `useEffect` in `PropertiesWithTreeView`); nessuna modifica
  alla catena di prop dei componenti `memo`; funziona anche dai mount della sidebar.
- **Contro**: è globale. Se in futuro esistessero due pannelli Properties pinnabili
  simultaneamente si pinnerebbero entrambi. Oggi non è il caso (§6.4).
- Nuova costante da aggiungere in `JjodelEvents` — nome proposto
  `PROPERTIES_PIN_VIEW: 'jjodel:properties-pin-view'`, verificato **assente** in tutto
  `frontend/src` (nessuna collisione, §4.3 delle regole).

**Raccomandazione**: opzione B, per allineamento a §8.7 e per il rapporto
superficie-di-diff / beneficio. Opzione A resta valida se Alfonso preferisce che il gesto
funzioni **solo** nel tree del pannello Properties e non in quello della sidebar.

---

## 5. Ri-targeting del pin

Il ri-targeting **esiste già ed è esattamente la primitiva che serve**: `handleInternalNavigate`
(226–228) fa `setPinnedSelected(sel)` — un set incondizionato su una tripla fornita dal
chiamante, che funziona identicamente sia da `null` (primo pin) sia da una tripla diversa
(ri-target). Non c'è nessuna logica "solo se non già pinnato".

Oggi è chiamato da 3 siti in `Info.tsx`: `MetamodelContents.handleSelect` (205),
`clearSelection` (1197, chiusura editor view → tripla vuota), `handleBreadcrumbClick` (1289).

Il doppio click sul tree può quindi riusare **lo stesso identico meccanismo interno**:
`setPinnedSelected({node:'', view: <viewId>, modelElement:''})`. Nessuna variante necessaria,
nessun caso speciale per "era già pinnato su un'altra vista" — la semantica ratificata
(ri-target sempre) è già il comportamento nativo del setter.

---

## 6. Rischi individuati

### 6.1 Ordine click/dblclick e doppio dispatch di `_lastSelected` — basso, accettabile

Sequenza DOM su doppio click: `click` → `click` → `dblclick`. Quindi `handleClick` gira
**due volte** (2 dispatch identici di `_lastSelected`) prima che parta l'auto-pin.

- Nessun conflitto sul valore: le due scritture sono identiche.
- Nessun inquinamento dell'undo: `reducer.ts:1282` esclude i delta `_lastSelected`-only da
  `isRelevantChangeCheck`, e `isOnlyTransientTopLevelChange` (1301–1314) li manda su un fast
  path che salta il bookkeeping di history. Costo trascurabile.
- È inoltre il comportamento **già in produzione oggi** (chiunque doppio-clicchi un nodo del
  tree produce già 2 selezioni); il gesto diventa solo intenzionale.
- **Non serve** quindi il pattern `setTimeout(150)` di `MegamodelNode`: click e dblclick qui
  sono complementari e idempotenti, non alternativi.

### 6.2 Il dispatch Redux è ASINCRONO — rischio REALE, condiziona il design

`Action.fire` (`action.ts:349`):

```ts
setTimeout(() => storee.dispatch({...this}), 0);   // "force action execution to be async"
```

Conseguenza: **subito dopo `SetRootFieldAction.new('_lastSelected', …)` lo store contiene
ancora il valore precedente.** Un'implementazione che, nel gestore del doppio click,
riusasse la logica di `togglePin` (leggere `store.getState()._lastSelected` per catturare la
tripla) pinnerebbe **la selezione precedente**, non la vista appena cliccata — e in modo
intermittente/non riproducibile a seconda del timing.

`togglePin` non ne soffre perché il click sul bottone avviene molto dopo che la selezione si è
assestata. Il doppio click invece cade *dentro* la finestra asincrona.

**Mitigazione obbligatoria**: la tripla va **costruita esplicitamente** dall'id del nodo
(`{node:'', view: view.id, modelElement:''}`) e trasportata nel `detail` dell'evento (o
nell'argomento della callback). Mai derivarla dallo store. Con questo, l'ordine relativo fra
i dispatch dei due click e il set dello stato React diventa irrilevante.

### 6.3 Doppio click dentro l'input di rename — rischio reale, va guardato

Durante il rename, `SubViewItem` passa un `<input>` come `nameOverride` (1180–1190) che viene
renderizzato **dentro** `.tree-row__content` (628). L'input ferma il `click`
(`onClick={(e) => e.stopPropagation()}`, 1188) ma **non** il `dblclick`. Un doppio click
nell'input per selezionare una parola — gesto standard durante un rename — farebbe risalire
l'evento e scatterebbe l'auto-pin.

**Mitigazione**: `if (isRenaming) return;` in testa all'handler (variabile già disponibile a
riga 1147), oppure `onDoubleClick={(e) => e.stopPropagation()}` sull'input. Preferibile la
prima: una guardia sola, nel punto in cui la condizione è già calcolata.

### 6.4 Mount multipli — basso

Con l'opzione B l'evento raggiunge tutte le istanze montate di `PropertiesWithTreeView`. Le
istanze in mode `popup`/`inline` eseguono comunque gli hook (l'early return è a riga 294,
dopo tutti gli hook) e imposterebbero uno stato di pin **mai renderizzato** (rendono
`<Info mode={mode}/>` senza `overrideSelected`). Innocuo, ma reale: da citare, non da
"risolvere" con complessità aggiuntiva.

### 6.5 Selezione di testo sul doppio click — cosmetico

`.tree-row` / `.tree-row__content` **non** hanno `user-select: none` (le sole 3 occorrenze
nel file SCSS sono su `tree-view-sidebar--dragging`, `tree-type-group__header`,
`tree-section__header`). Il doppio click evidenzierà quindi il nome della vista. Sistemabile
con una riga in `tree-view-sidebar.scss`, **ma è un file non nominato nel prompt** → serve
autorizzazione esplicita (regola 1), oppure si accetta l'evidenziazione.

### 6.6 Nessun feedback visivo del pin nel tree — non un bug, una domanda di design

`selectedElementId` (2280) è `_lastSelected?.modelElement`: i nodi vista/viewpoint **non
ricevono mai** la classe `tree-row--selected`. Oggi, cliccando una vista, il tree non mostra
alcuno stato di selezione; dopo il doppio click non mostrerà alcuno stato di "pinnata".
L'unico feedback sarà l'icona `bi-pin-angle-fill` nell'header di Properties. Da confermare se
è sufficiente (§7 D3).

### 6.7 Race con `pinnedResolvable` — nessuna

La useEffect di unpin (207–209) legge `state.idlookup?.[viewId]`: la vista è per costruzione
in `idlookup` (il tree stesso la deriva da lì e `DPointerTargetable.from(vp.id)` la usa a riga
1300). Il selettore inline viene rieseguito nel render in cui `pinnedSelected` cambia
(react-redux 9), quindi `effectivePin` è corretto già nel primo commit — è lo **stesso path
già percorso da `togglePin`**, in produzione dal 2026-07-05. Nessun rischio nuovo.

---

## 7. Domande aperte per Alfonso

**D1 — `VP` conta come "vista"?** Lo scope dice "solo i nodi vista". Nel tree però ci sono due
tipi di nodo che scrivono `view` nella tripla: `SubViewItem` (badge `v`, `DViewElement`, →
`ViewData`) e `ViewpointNode` (badge `VP`, `DViewPoint`, → `ViewpointProperties`). L'auto-pin
va su entrambi o **solo** su `v`? (Costo implementativo identico; è una scelta semantica.)
**Assunzione se non rispondi**: entrambi — sono i due nodi "view-tipati" del tree e la
simmetria evita un'eccezione da spiegare.

**D2 — Canale**: opzione B (CustomEvent, raccomandata, funziona anche dal tree della sidebar)
oppure opzione A (prop drilling, il gesto vive solo dentro il pannello Properties)?

**D3 — Properties collassato**: se `isPropertiesVisible === false` (pannello ridotto a rail), il
doppio click pinna uno stato invisibile. Il doppio click deve **anche** riaprire il pannello
Properties (`setIsPropertiesVisible(true)`), o pinnare in silenzio?

**D4 — Feedback visivo nel tree** (§6.6): basta l'icona pin nell'header di Properties, o vuoi
un marker sulla riga della vista pinnata? (Il secondo caso allarga lo scope a
`tree-view-sidebar.scss` + a un canale di ritorno pin→tree, quindi lo terrei per dopo.)

**D5 — `user-select: none` sulle righe del tree** (§6.5): autorizzi la riga in
`tree-view-sidebar.scss`, o si accetta che il doppio click evidenzi il nome?

---

## 8. Piano Fase 2 proposto (NON eseguito — in attesa di go-ahead)

Assumendo D1 = entrambi, D2 = opzione B, D3 = pinna e basta, D4 = no marker, D5 = no SCSS:

**File 1 — `frontend/src/events/registry.ts`**: in `JjodelEvents`, sotto il gruppo `// Panels`,
`PROPERTIES_PIN_VIEW: 'jjodel:properties-pin-view',` (nome verificato libero).

**File 2 — `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`**:
- `EntityRowProps` (549–572, interfaccia **non esportata**): + `onDoubleClick?: (e: React.MouseEvent) => void`.
- `EntityRow`: destrutturare `onDoubleClick` (575–580) e aggiungerlo al div `.tree-row__content` (626) accanto a `onClick`.
- `SubViewItem`: nuovo `handleDoubleClick` accanto a `handleClick` (dopo 1166) —
  `if (isRenaming) return;` (§6.3), `e.stopPropagation()`, dispatch di
  `PROPERTIES_PIN_VIEW` con `detail: { selected: { node:'', view: view.id, modelElement:'' } }`
  (tripla esplicita, §6.2); passarlo a `EntityRow` (1222).
- `ViewpointNode`: idem con `vp.id` (dopo 1297, prop a 1333). Nessuna guardia rename qui
  (i VP non hanno rename inline).
- `handleClick` esistenti: **invariati** (la selezione continua a passare dai due click).

**File 3 — `frontend/src/components/editors/PropertiesWithTreeView.tsx`**:
- `useEffect` con listener su `JjodelEvents.PROPERTIES_PIN_VIEW` →
  `setPinnedSelected(detail.selected)`. Dipendenze `[]` (il setter è stabile). Registrato
  accanto al listener `TOGGLE_TREE_VIEW` esistente (283–291), con cleanup simmetrico.
- Nessuna modifica a `togglePin`, `pinnedResolvable`, `handleInternalNavigate`, al bottone o
  a `<Info>`: il set passa dalla primitiva già esistente e i guard restano quelli.

**File 4 — `docs/claude-code-log.md`**: entry di fine task.

Superficie totale: 3 file di runtime, ~25 righe, tutte additive. Nessuna interfaccia esportata
modificata, nessuna dipendenza nuova, nessuna scrittura Redux nuova, nessun file critical-zone.

**Verifica prevista**: `npm run typecheck` (senza aumento del baseline) + `npm run build`.
Smoke test manuale: (1) doppio click su view → Properties mostra `ViewData` e l'icona pin è
piena; (2) doppio click su una seconda view → il pannello segue la nuova, il pin resta attivo;
(3) singolo click su una classe mentre è pinnato → il pannello **non** si muove; (4) unpin col
bottone → il pannello torna a seguire; (5) rename inline di una view con doppio click
nell'input → **non** pinna; (6) delete della view pinnata → unpin automatico.

---

**HARD STOP** — Fase 1 conclusa. Nessun codice scritto. In attesa delle risposte a §7 e del
go-ahead per la Fase 2.
