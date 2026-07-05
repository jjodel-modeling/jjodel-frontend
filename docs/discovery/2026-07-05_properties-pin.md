# Discovery — Pin su Properties (fase 2 decoupling)

**Data**: 2026-07-05
**Tipo**: discovery read-only (Fase A del processo two-phase) → HARD STOP
**Branch**: `alfonso-frontend-jjtl`
**Prompt**: `2026-07-05 15:32 — Pin su Properties (fase 2 decoupling, two-phase)`

> Nessun file di runtime modificato. Questo documento + la sintesi in chat sono l'unico output della Fase A.
> La Fase B parte **solo** dopo go-ahead esplicito di Alfonso.

---

## 0. Metodo

Discovery su `Info.tsx` (1410 righe, connesso Redux), `PropertiesWithTreeView.tsx` (post-fase-1),
`joiner/classes.ts` (`fromPointer`/`wrap`), `redux/reducer/reducer.ts` (delete), `common/Dummy.ts`
(delete → clear selezione), `redux/store.tsx` (shape di `DState`). Tutte le righe citate riverificate
sul working tree locale (non sui numeri del prompt).

---

## 1. Q1 — Risoluzione della selezione in `Info.tsx`

**`mapStateToProps`** (righe **1382–1393**) — confermato:

```ts
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeID = state._lastSelected?.node;          // 1384
    const viewID = state._lastSelected?.view;           // 1385
    const dataID = state._lastSelected?.modelElement;   // 1386
    if (nodeID) ret.node = LGraphElement.fromPointer(nodeID);
    if (viewID) ret.view = LViewElement.fromPointer(viewID);
    if (dataID) ret.data = LModelElement.fromPointer(dataID);
    ret.topics = state.topics;
    ret.advanced = state.advanced;
    return ret;
}
```

- **`mapStateToProps` riceve GIÀ `ownProps: OwnProps`** ma oggi non lo usa. Questo è il punto d'innesto pulito
  per `overrideSelected`.
- **`Info` accetta già ownProps oltre a `mode`**: `OwnProps` (1363–1367) ha `mode`, `style?`, `localData?`.
  Aggiungere `overrideSelected?` e `onInternalNavigate?` è puramente additivo, nessuna interfaccia esistente cambia.

**Rendering path guidati dalla tripla** (`InfoComponent`, 1049–1361):
- destruttura `{node, view, topics, advanced, mode}` (1051); `data = props.data` (1166), poi `ddata = data?.__raw || data`.
- **Ramo VIEW** (1185–1212): se `tab && props.view` risolve a `DViewPoint`/`DViewElement` →
  `ViewpointProperties` oppure `ViewData` (Monaco). Ha precedenza sul ramo element.
- **Ramo ELEMENT** (1214–1345): `switch(ddata.className)` → `builder.model/package/class/...` + pannello tab con
  header/breadcrumb/overview.
- **Fallback** (1348–1359): `popup`/`inline`.
- Empty state tab: `if (!data || !ddata?.className)` → `<Empty/>` (1247–1252).

**INSIGHT CHIAVE (regge tutto il design)**: il pin è uno **swap trasparente della *sorgente* della tripla**.
`mapStateToProps` risolve la tripla di stringhe-ID nello stesso identico modo sia che venga da `_lastSelected`
sia che venga da `overrideSelected`. Quindi *qualunque* cosa il pannello mostri per la selezione corrente, il pin
la congela **identica** — non serve replicare né capire i rami di rendering, basta cambiare da dove arriva la tripla.
`_lastSelected` è la tripla di ID `{node, view, modelElement}` (stringhe, `''` = nessuno); `overrideSelected` ha la
stessa identica forma.

---

## 2. Q2 — Siti interni che scrivono `_lastSelected` dentro `Info.tsx`

`grep -n "_lastSelected" Info.tsx` → **3 scritture** (199, 1188, 1278) + 3 letture (1384–1386). Le tre scritture:

| Riga | Contesto | Interazione utente | Tripla scritta | Dove vive |
|------|----------|--------------------|----------------|-----------|
| **199** | `MetamodelContents.handleSelect` | click su una classe/enum/package nella lista CONTENTS di un DModel | `{node:'', view:'', modelElement: elementId}` | funzione `MetamodelContents` (191), resa via `builder.model` (369) |
| **1188** | `clearSelection` (in `InfoComponent`) | passata a `<ViewData setSelectedView={clearSelection}/>` — chiusura dell'editor di view | `{node:'', view:'', modelElement:''}` (azzera) | direttamente in `InfoComponent` |
| **1278** | `handleBreadcrumbClick` (in `InfoComponent`) | click su un segmento antenato del breadcrumb | `{node:'', view:'', modelElement: elementId}` | direttamente in `InfoComponent` |

Tutte e tre sono **navigazione interna al pannello** (semantica punto 3): con pin attivo devono aggiornare il
target del pin. Nessun altro sito in `Info.tsx`.

- **1188 e 1278**: `onInternalNavigate` è banalmente disponibile (è una prop di `InfoComponent`).
- **199**: `MetamodelContents` è annidata e resa da `builder.model(data, advanced, useNewDesign)` (firma
  `static model(data, advanced, skipTitle=false)` a riga 321, chiamata a 1220). Per raggiungere il sito 199 serve
  **threading additivo**: 4° parametro opzionale `onInternalNavigate?` su `builder.model` → prop su
  `MetamodelContents` → chiamata in `handleSelect`. È un'aggiunta di ~3–4 righe, **non un refactoring** del path.

**Altri writer di `_lastSelected` (ESTERNI, fuori scope)**: `graphElement.tsx` (586, 987 — canvas classico),
`EditorV2.tsx` (2504, 3211 — v2-flow), `useJjomSelection.ts` (125/162/168/210/247 — v2-flow),
`TreeViewContent.tsx` (9 siti — tree), `Tree.tsx` (forEndUser), `DockManager.tsx` (194), `Dummy.ts` (81 — clear su
delete). Continuano a scrivere `_lastSelected` e a fare tutto ciò che fanno oggi; il pannello semplicemente **non li
segue** quando è pinnato (è esattamente ciò che `overrideSelected` realizza). NON vanno toccati.

---

## 3. Q3 — Guardia per selezione dangling (semantica punto 5)

**Cosa rende Info oggi con selezione cancellata?** Il flusso di delete è *atomico*:
- `reducer.ts:387` — su `DeleteElementAction` con `newVal === undefined`, `delete current[key]` → **l'entry
  `state.idlookup[id]` sparisce**.
- `Dummy.ts:81` — `SetRootFieldAction.new('_lastSelected', undefined, '')` → **la selezione globale viene azzerata**
  nella stessa operazione.

Quindi per la selezione *globale* non esiste il problema: `_lastSelected` diventa `undefined` →
`mapStateToProps` non setta `node/view/data` → `InfoComponent` rende `<Empty/>`. **Non c'è una guardia dedicata in
Info**: la robustezza viene dall'azzeramento esterno atomico, non da un check interno.

**Perché il pin ha bisogno di una guardia in più**: `pinnedSelected` è stato **React locale**; dopo il delete tiene
ancora l'ID stale. Senza guardia il pannello resterebbe pinnato su `<Empty/>` per sempre → viola il punto 5
(«unpin automatico e ritorno al follow»).

**Crash-safety confermata (nessun crash anche nel frame transitorio)**:
- `LModelElement/LViewElement/LGraphElement.fromPointer` → `LPointerTargetable.fromPointer` (classes.ts:2435) →
  `LPointerTargetable.wrap` (254).
- `wrap` su ID cancellato: `DPointerTargetable.from(id)` = undefined → riga 261 `Log.e(canThrow=false, ...)`
  **non lancia** (canThrow default `false`) → ritorna `undefined`.
- Quindi `overrideSelected` con ID stale → `props.data = undefined` → `<Empty/>`. **Nessun throw.**
  (Effetto collaterale minore: un dev-log per render finché la guardia non pulisce — evitabile col gate inline sotto.)

**Segnale di guardia proposto**: esistenza in `idlookup` (top-level di `DState`, `store.tsx:124`
`idlookup: Record<Pointer, DPointerTargetable>`):

```ts
const pinnedResolvable = useSelector((s: any) => {
    if (!pinnedSelected) return false;
    const id = pinnedSelected.modelElement || pinnedSelected.view || pinnedSelected.node;
    if (!id) return true;                    // pin su selezione vuota → non è "dangling"
    return !!s.idlookup?.[id];
});
useEffect(() => {
    if (pinnedSelected && !pinnedResolvable) setPinnedSelected(null);   // unpin automatico
}, [pinnedSelected, pinnedResolvable]);
```

Consiglio inoltre il **gate inline** (oltre alla useEffect): passare
`overrideSelected={pinnedResolvable ? pinnedSelected : undefined}` così nel frame transitorio non si passa mai un
ID stale (niente flash di Empty né dev-log), e la useEffect pulisce lo stato subito dopo.

---

## 4. Q4 — Dipendenze di `PropertiesWithTreeView` dalla selezione globale

Unico read della selezione globale: **`viewSelected`** (riga **111**,
`useSelector(s => !!s._lastSelected?.view)`), usato solo a riga **181** per `style={{maxWidth:'none'}}` sul
container Properties (evita che i Monaco di ViewData vengano clampati). Nessun altro sito legge la selezione
(`advanced` a 103 è indipendente). Con pin attivo:

```ts
const effectiveViewSelected = pinnedSelected ? !!pinnedSelected.view : viewSelected;
// usato a riga 181 al posto di viewSelected
```

Poiché il pin cattura anche `view`, `pinnedSelected.view` riflette la view congelata → `maxWidth` corretto sia in
pin che dopo unpin.

---

## 5. Q5 — Altri consumer di `Info`

Consumer del **vero** `Info` (`components/editors/Info`):

| Sito | mode | Impatto delle prop opzionali |
|------|------|------------------------------|
| `PropertiesWithTreeView.tsx:163` | `mode` (non-tab early return) | nessuno — non riceve le nuove prop |
| `PropertiesWithTreeView.tsx:195` | `tab` | **è qui che si wira il pin** |
| `panels/ElementPropertiesDrawer.tsx:17` | `inline` | nessuno (prop opzionali non passate) |
| `contextMenu/ContextMenu.tsx:559` | `popup` | nessuno |

(`PaletteData.tsx` usa un `Info` **diverso** — tooltip da `forEndUser/Info` — irrilevante.)

`overrideSelected` agisce solo se presente in `mapStateToProps`; `onInternalNavigate` è chiamato solo se presente.
Il pin è `tab`-only (semantica punto 1) e va passato **solo** al `<Info mode={mode}/>` di riga 195. popup/inline/
non-tab non regrediscono.

---

## 6. Q6 — Validazione del wiring proposto

**Il wiring proposto REGGE, senza alternative più pulite necessarie.**

1. **`overrideSelected` in `mapStateToProps`** — pulito e additivo:
   ```ts
   const sel = ownProps.overrideSelected;
   const nodeID = sel ? sel.node : state._lastSelected?.node;   // idem view / modelElement
   ```
   `connect` rirunna `mapStateToProps` sia su cambi di store sia su cambi di `ownProps` (la firma a 2 argomenti lo
   abilita). Effetto: il pannello **non segue** i cambi esterni di `_lastSelected`, ma **riflette ancora** gli edit
   dell'elemento pinnato (rename ecc.) perché lo store cambia e `fromPointer` ri-risolve. Coerente col punto 2.

2. **`onInternalNavigate?(triple)` accanto al dispatch esistente** ai 3 siti — **necessario**: con override attivo,
   senza questa callback la navigazione interna non aggiornerebbe il pannello (leggerebbe ancora la tripla pinnata) e
   sembrerebbe "bloccato". La callback aggiorna `pinnedSelected` alla stessa tripla che il dispatch scrive. Il
   dispatch esistente **resta invariato** (vincolo rispettato): la navigazione interna continua anche a muovere la
   selezione globale come oggi, e in più ri-targetizza il pin → dopo la nav interna `pinnedSelected` coincide con la
   nuova selezione, e lo screening esterno riprende da lì.

3. **Threading per il sito 199** (unico dettaglio non banale): `builder.model` → `MetamodelContents`, 4° param
   opzionale. Additivo, ~3–4 righe, nessun refactor.

**Nessuna alternativa più pulita**: Context React o rilevamento "origine della scrittura" aggiungerebbero più
superficie di quella risparmiata. Lo swap di sorgente in `mapStateToProps` + callback esplicite è il minimo.

---

## 7. Piano Fase B proposto (da confermare col go-ahead)

**File 1 — `Info.tsx`** (solo aggiunte opzionali):
- `OwnProps`: `overrideSelected?: {node?: string; view?: string; modelElement?: string}`,
  `onInternalNavigate?: (sel: {node: string; view: string; modelElement: string}) => void`.
- `mapStateToProps`: risolvi da `ownProps.overrideSelected` con precedenza su `state._lastSelected`.
- Siti 1188 e 1278: `props.onInternalNavigate?.(<stessa tripla del dispatch>)` accanto al `SetRootFieldAction`.
- `builder.model(..., onInternalNavigate?)` → `<MetamodelContents ... onInternalNavigate={onInternalNavigate}/>`;
  `MetamodelContents.handleSelect`: `props.onInternalNavigate?.({node:'',view:'',modelElement:elementId})` accanto al
  dispatch. Passaggio da `InfoComponent` (1220): `builder.model(data, advanced, useNewDesign, props.onInternalNavigate)`.

**File 2 — `PropertiesWithTreeView.tsx`**:
- `const [pinnedSelected, setPinnedSelected] = useState<{node:string;view:string;modelElement:string}|null>(null)`.
- `const lastSelected = useSelector((s:any) => s._lastSelected)` per catturare la tripla al momento del pin.
- Toggle pin: `setPinnedSelected(prev => prev ? null : {node:lastSelected?.node||'', view:lastSelected?.view||'', modelElement:lastSelected?.modelElement||''})`.
- `pinnedResolvable` (useSelector idlookup) + useEffect di unpin automatico + gate inline su `overrideSelected`.
- `effectiveViewSelected` per il `maxWidth`.
- Bottone pin in `properties-panel-header` (prima del toggle esistente): `bi-pin-angle` / `bi-pin-angle-fill` attivo.
- `<Info mode={mode} overrideSelected={effectivePin ?? undefined} onInternalNavigate={pinnedSelected ? handleInternalNavigate : undefined}/>` (solo il sito tab, riga 195).

**File 3 — `properties-with-tree-view.scss`**: `.properties-panel-pin-btn` speculare a
`.properties-panel-toggle-btn` (24×24, hover bg-tertiary) + `.is-active i { color: var(--accent-cyan,#0ea5e9) }`
(cyan come *active indicator*, on-spec §7.1 — mai come bg). Dark mode nel blocco `[data-theme="dark"]` esistente.

**File 4 — `docs/claude-code-log.md`**.

Nessuna nuova scrittura Redux: il pin vive interamente in stato locale React.

---

## 8. Decisioni (RISOLTE da Alfonso, 2026-07-05)

1. **Pin con nulla selezionato** → **cattura la tripla vuota** (pannello Empty pinnato; il gate lo tratta come
   non-dangling; unpin con un click). ✅
2. **Sito 1188 (`clearSelection`/chiusura editor di view) con pin attivo** → **pin resta, mostra Empty**
   (`onInternalNavigate` porta il pin a tripla vuota, coerente con "la nav interna aggiorna il target"). ✅
3. **Gate inline anti-flash** (§3) → **sì, aggiungilo** (passa `overrideSelected` solo se risolvibile; evita flash di
   Empty + dev-log nel frame di delete; costo nullo). ✅

## 9. Rischio / Layer Impact

- Nessun file critical-zone (§3.1): niente sync/D-L/JjOM/VersionFixer/persistence. Solo componenti di presentazione +
  `mapStateToProps` (lettura). **Layer Impact Report: not-required** in Fase B.
- Nessuna modifica alle interfacce esistenti (solo prop opzionali). Nessuna nuova dipendenza. Nessuna scrittura Redux.
- `_lastSelected` per gli altri consumer (canvas/tree/console/…): **invariato** (fuori scope, rispettato).

---

**HARD STOP** — in attesa di go-ahead di Alfonso prima della Fase B.
