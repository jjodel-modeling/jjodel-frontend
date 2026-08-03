# Discovery (read-only) — F2: mount overlay app-level + reset layout persistiti

**Data**: 2026-07-29
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery mirata Fase 1 di F2 (read-only). Nessuna modifica al sorgente, nessun commit, nessun build.
**Base**: `docs/discovery/discovery_2026-07-28_floating_panels_canvas.md` (referenziato, non rimappato) + ratifiche 2026-07-29 + F1 (`docs/claude-code-log.md`, entry 2026-07-29 redirect Documentation).
**Nome documento prompt**: 2026-07-29 Fase 2 F2 discovery overlay mount + migration

---

## Sommario esecutivo (leggere prima)

Due meccanismi da pinnare per F2. Findings netti:

1. **Domanda A (mount host)**: `PropertiesWithTreeView` ha **una sola prop** (`mode`) e **un solo call-site** (`Dock.tsx:282`, `mode='tab'`). Legge Redux (`useStore`/`useSelector`) e il context `useTreeViewPanel()`. **`TreeViewPanelProvider` avvolge l'INTERA app** (`App.tsx:119`), sopra entrambi i candidati di mount (Dashboard `:622`, FAB Jodie `:170`) → **nessuna barriera di context**: si può montare standalone in uno qualsiasi dei due punti. **Raccomandato: sibling di `<Dock/>` in `ProjectDashboard`** (lifecycle legato alla presenza del canvas). Vincolo strutturale scoperto: il gate `mode !== 'tab'` a `:318` fa cadere qualsiasi altro valore su `<Info/>` puro — un nuovo mode `'floating'` deve estendere quel ramo per rendere lo split.

2. **Domanda B (persistenza layout)**: **RIBALTAMENTO del rischio #4 del report base**. La persistenza rc-dock su `DProject.layout`/`DUser.layout` è **CODICE MORTO**: `PinnableDock.load()`/`save()` (`MyRcDock.tsx:665-732`) hanno **zero chiamanti**; il layout è **ricostruito fresco a ogni render** in `Dock.tsx:323-348` e passato come `defaultLayout` (non `loadLayout`); i backend setter sono stub. **Non esiste alcun layout a due pannelli persistito da migrare o resettare.** F2b **NON** è una migrazione VersionFixer — è la rimozione del push di `children[1]` in `Dock.tsx:337-348`. Verificato indipendentemente (§Domanda B).

3. **Conferme**: full-width viene **strutturalmente gratis** (rc-dock normalizza il figlio unico a 100%; lo dimostra già la regola both-collapsed `style.scss:1158-1163`); l'assunzione `.editor-v2 height:100vh` (rischio #6) resta **ortogonale e pre-esistente**. Disposizione impilata = `flex-direction: column` + card a **height** fissa invece di width + **2 resize handle da riorientare** `col-resize`→`row-resize`. Cluster di riapertura **già dock-independent** (portal body, `position:fixed`, z 900); solo il **gating** è dock-driven e va ridefinito da "both-collapsed" a "overlay nascosto".

4. **Critical-zone**: tutti i file letti sono **puliti** (nessun import `useJjomSync`/`portDistribution`/`sync/*`). Catena dock+overlay+persistenza confermata critical-zone-free.

---

## File letti (path + regione)

| File | Regione | Scopo |
|------|---------|-------|
| `frontend/src/App.tsx` | 44-186 | Provider tree, mount FAB Jodie `:170` |
| `frontend/src/pages/components/Dashboard.tsx` | 590-639 | render tree di `ProjectDashboard`, sibling di `<Dock/>` `:622` |
| `frontend/src/components/abstract/Dock.tsx` | intero (1-435) | costruzione layout, push figli, width-lock note, handleLayoutChange |
| `frontend/src/components/editors/PropertiesWithTreeView.tsx` | intero (1-505) | props, dipendenze store/context, width-lock effect, cluster portal |
| `frontend/src/contexts/TreeViewPanelContext.tsx` | intero (1-351) | provider, `activeEditorType`, gating |
| `frontend/src/components/dock/MyRcDock.tsx` | 430-504, 636-733 | defaultLayout statico, save/load, render |
| `frontend/src/components/editors/properties-with-tree-view.scss` | 30-113, 387-400, 890-963 | flex root, resize handle, cluster |
| `frontend/src/components/editor-v2/EditorV2.scss` | 12-51 | `.editor-v2` full-width/100vh |
| `frontend/src/components/abstract/style.scss` | 1108-1177 | consumer width-lock / both-collapsed / doc |
| `frontend/src/redux/VersionFixer.tsx` | (via agente) | migrazioni, `highestVersion` |
| `frontend/src/joiner/classes.ts` | (via agente) | definizione `DProject/DUser.layout` |
| `frontend/src/api/persistance/users.ts` | (via agente) | stub persistenza layout |

---

# DOMANDA A — Mount host dell'overlay

## A1 — Props e dipendenze di `PropertiesWithTreeView`

**Interfaccia** (`PropertiesWithTreeView.tsx:48-50`):
```typescript
interface PropertiesWithTreeViewProps { mode: 'popup' | 'tab' | 'inline'; }
```
**Una sola prop** (`mode`). **Un solo call-site nel codebase**: `Dock.tsx:282` con `mode='tab'` (grep esaustivo: nessun uso `popup`/`inline` esistente). Montarlo standalone = aggiungere un secondo call-site.

**Cosa legge da store/context** (tutto risolvibile fuori dal dock):
- Redux via `useStore()` (`:195`, letture imperative di `store.getState()._lastSelected` al pin `:215`) e `useSelector()` (`:166` `state.advanced`; `:200-205` `state.idlookup` per il dangling-guard del pin).
- Context `useTreeViewPanel()` (`:177-185`): `isVisible`, `show`, `toggle`, `isHighlighted`, `isScriptExecuting`, `attentionPulse`, `activeEditorType`.
- localStorage: `jjodel_property_tree_view_width`, `jjodel_property_panel_width`, `jjodel_property_panel_visible` (tutte self-contained, nessun lettore esterno — vedi report base B7).
- Eventi window: `PROPERTIES_PIN_VIEW` (`:300`), `TOGGLE_TREE_VIEW` (`:311`).

**Nessuna dipendenza dal contesto dock.** Non legge `DockManager`, non usa API rc-dock, non legge la posizione del pannello. → **Può montarsi senza il dock.**

## A2 — Provider tree: nessuna barriera di context

`App.tsx:113-186` avvolge l'intera app (router incluso) in questo ordine:
```
SettingsModalProvider > ToastProvider > DevModeProvider > GlobalDrawerProvider
  > FeaturesPanelProvider > TreeViewPanelProvider > .router-wrapper { <Routes/> ... <Jodie/> }
```
Il Redux `<Provider>` sta **sopra** `App` (App è `connect()`-ata). Quindi **entrambi** i candidati di mount stanno dentro **sia** il Redux Provider **sia** `TreeViewPanelProvider`:
- **FAB Jodie** (`App.tsx:170` `{user && <Jodie/>}`) — dentro `.router-wrapper`, quindi dentro tutti i provider.
- **Dashboard** (`Dashboard.tsx:622`) — montata dalla route `/project` (`App.tsx:135` → `ProjectPage` → `ProjectDashboard`), anch'essa dentro tutti i provider.

→ `useTreeViewPanel()` e `useStore()`/`useSelector()` **risolvono in entrambi i punti**. Nessuna barriera.

## A3 — Candidato mount host: raccomandazione

`ProjectDashboard` (`Dashboard.tsx:609-631`) rende:
```
<> ...css... <Navbar/>
   <div className="dashboard-container two-column">
     {!hideLeftBar && <LeftBar/>}
     <div className="project-dock-wrapper"><Try><Dock/></Try></div>   ← :622
   </div>
   <StatusBar/>
</>
```

| Criterio | Dashboard (sibling di `<Dock/>`) | App-level (vicino a Jodie `:170`) |
|----------|-----------------------------------|-------------------------------------|
| Redux + TreeViewPanel context | ✅ (A2) | ✅ (A2) |
| **Lifecycle** | montato **solo** su `/project` → esiste **quando c'è il canvas**; unmount naturale al cambio route | montato su **ogni** route (gated `user &&`) → richiede gating esplicito per non apparire su `/allProjects` ecc. |
| z-index / posizionamento | irrilevante (portal→body, `position:fixed` — vedi A4) | idem |
| Gating `editorType`/`layoutMode` | `activeEditorType` dal context copre model/metamodel; naturale | serve gating aggiuntivo route-level |

**Raccomandato: mount in `ProjectDashboard`** — sibling di `<Dock/>` (dentro `.project-dock-wrapper` o alla radice del fragment `:609`). Il DOM parent è **indifferente** perché l'overlay portala su body (A4); conta solo il lifecycle React + l'accesso al context, entrambi ottimali qui. **Decisione finale in chat** (il prompt lascia la scelta aperta).

## A4 — Portal su body: cosa portalare

Oggi **solo il cluster flottante** portala su body (`PropertiesWithTreeView.tsx:448-470`, `createPortal(..., document.body)`, `position:fixed` via `.properties-tree-floating-cluster` `scss:898-902`). Il pannello principale (`.properties-with-tree-view`) è reso **in-flow** nel tab dock.

Per l'overlay (strategia (b) raccomandata dal report base, tier z ~900): l'**intero** contenuto va portalato su body in `position:fixed`. Due strade di mappatura (scelta in chat):
- **Wrapper nuovo**: un componente overlay che `createPortal` di un `<div class="...-overlay" style="position:fixed; ...">` contenente `<PropertiesWithTreeView mode='floating'/>`, con offset 8px (ratifica) e z ~900.
- **Portal interno**: spostare il portal dentro `PropertiesWithTreeView` gated su `mode==='floating'`, avvolgendo l'intero `return` (non solo il cluster).

## A5 — Vincolo strutturale: il gate `mode !== 'tab'` (IMPORTANTE per F2a)

Due gate governano `mode`, e **sono accoppiati al contrario** rispetto a ciò che serve:

1. **Render dello split** — `:318`: `if (mode !== 'tab') return <Info mode={mode} />;`
   → **solo** `'tab'` rende lo split Properties+Tree. Un nuovo mode `'floating'` cadrebbe qui su `<Info/>` puro (niente split).

2. **Width-lock del tab dock** — `:258`: `if (mode !== 'tab') return;` (effect `:257-280` che scrive su `document.body` `--properties-tree-tab-width`, `data-properties-tree-width-lock`, `data-properties-tree-both-collapsed`).
   → **solo** `'tab'` scrive gli attr body del width-lock (consumati da `abstract/style.scss:1119-1168` per dimensionare `.dock-panel:last-child`).

**Ciò che serve per F2a**: rendere lo split **senza** scrivere gli attr body del dock. Quindi i due gate devono **divergere**:
- estendere `:318` a `if (mode !== 'tab' && mode !== 'floating') return <Info/>` (rende lo split anche per `'floating'`);
- lasciare `:258` invariato (`'floating' !== 'tab'` → l'effect width-lock **non parte**, corretto: nel mondo overlay non c'è `.dock-panel:last-child` da dimensionare).

Questo separa nettamente "rendi lo split" da "scrivi il width-lock del dock". **È la modifica strutturale centrale di F2a.** (Alternativa più sporca: riusare `mode='tab'` e lasciare che gli attr body diventino no-op inerti una volta rimosso il figlio destro — sconsigliata, mescola i due concern e lascia scritture body inutili.)

**Valore del nuovo mode**: la scelta `'floating'` (o riuso di `'tab'`) si decide in chat. La mappatura sopra assume un nuovo `'floating'`.

---

# DOMANDA B — Persistenza e reset del layout

## B1 — RIBALTAMENTO: la persistenza rc-dock è codice morto

Il report base (B5 punto 5, rischio #4, OQ #4) assume che i layout a due pannelli siano **persistiti** in `DUser/DProject.layout` e vadano **migrati/resettati**. **Falso sul codice corrente.** Verificato indipendentemente (grep esaustivo, non un singolo trace — §5.1):

| Verifica | Risultato |
|----------|-----------|
| Chiamanti di `PinnableDock.load` / `PinnableDock.save` (def. `MyRcDock.tsx:665`/`:717`) | **ZERO** fuori dalle definizioni stesse |
| Chiamanti di `loadLayout(` | solo `Dock.tsx:199`, `Navbar.tsx:1705`, nota JjTL `Dock.tsx:347` — **tutti** operano sul layout **live** (`getLayout()`), **nessuno** legge `DProject/DUser.layout` |
| Read di `.layout[slot]` fuori da `classes.ts`/`MyRcDock.tsx` | **ZERO** |
| `<PinnableDock>` element | `Dock.tsx:398` usa `defaultLayout={layout}` (**non** `loadLayout`) |
| Backend setter | `users.ts:80` `setUserLayout(){}` vuoto; `:73`/`:76` `throw "Method not implemented."` |

**Come nasce davvero il layout all'apertura** (`DockComponent`, `Dock.tsx`):
- `LayoutData` **ricostruito fresco a ogni render**: `const layout = {dockbox:{mode:'horizontal', children:[]}}` (`:323`); size da `calculatePanelSizes(layoutMode)` (`:327`); figli pushati (`:330` sinistro, `:348` destro).
- Passato come **`defaultLayout` prop** a `PinnableDock` (`:398`). rc-dock usa `defaultLayout` al mount; `key={''+advanced}` forza remount al toggle advanced.
- La **sizing** persiste in **localStorage** (`jjodel_layout_mode` `:34`, `jjodel_dock_ratio_${mode}` `:83/:90`, `jjodel_vertical_console_height` `:153`), **non** nel D-model. Il resize runtime salva solo il ratio in localStorage (`handleDockResize` `:211-224`, guardato `children.length>=2`).

**Conseguenza**: `DProject.layout`/`DUser.layout` default `{}` (`classes.ts:1290`/`:836`) e **mai letti** all'apertura. Non c'è alcuno stato a due pannelli che possa sovrascrivere il `defaultLayout` fresco. **Ogni progetto — nuovo o salvato — apre con qualunque forma `Dock.tsx` costruisca in quel momento.**

## B2 — Campo versione del layout: assente, e irrilevante

- **Nessun campo `version` sul `LayoutData`** persistito (output raw di `getLayout()`).
- **VersionFixer**: nessuna migrazione tocca `dockbox`/`DUser.layout`/`DProject.layout`. Gli unici hit "layout" sono i campi **scalari shell 4-colonne** (`layoutPropertyPanelWidth`, `layoutTreeWidth`, ecc.) seminati da `2.216 -> 2.217` — feature diversa, non il `LayoutData` rc-dock. `highestVersion` = **2.227** (derivato in `setup()` come max dei `to` dei nomi-metodo `'X.Y -> X.Z'`).
- **F2b non richiede alcuna migrazione VersionFixer** (§3.9 CLAUDE.md non si applica: nessun `jsxString`, nessun `DProject.layout` da riscrivere).

## B3 — Injection point per il "reset" (in realtà: non-push del figlio destro)

Poiché non esiste stato persistito, il "reset ratificato" si riduce a: **non costruire più il figlio destro del dockbox**. Injection point unico e infallibile:

- **`Dock.tsx:337-348`** — il blocco che costruisce `tabs` (Properties/Node/Console/MTM/Logger) e fa `layout.dockbox.children.push({tabs, size: rightSize})` (`:348`). Rimuovendo il push, il dockbox nasce con **un solo figlio** (`children[0]`, gruppo canvas). Essendo il layout ricostruito fresco a ogni open, **ogni** progetto apre single-panel — nessun fantasma possibile (non c'è nulla che possa reintrodurre il figlio destro).
- Corollari (da valutare in F2a/F2b, non tutti necessari):
  - `calculatePanelSizes`/`rightSize` (`:327`) diventa inutilizzato per il dock (resta usato da `getInitialPanelWidth` deprecato).
  - `groups.editors` (`:275`) diventa orfano (nessun tab lo usa) — lasciare o pulire è decisione separata.
  - `handleLayoutChange` (`:353-394`) legge `children[0]` → invariato; il ramo `data-active-tab='documentation'` (`:388-393`) è già neutralizzato da F1 (doc redirect a `children[0]`).
  - I guard `children.length>=2` in `handleLayoutChange`/`handleDockResize` (`:172`/`:214`) diventano no-op **già oggi** con un figlio solo (report base B5 punti 2-3) → nessuna rottura.

## B4 — Cosa si perde col reset

Dato che **niente** è persistito nel D-model per il layout dock:
- **Ratio dock**: vive in localStorage per-mode (`jjodel_dock_ratio_${mode}`). Con figlio unico diventa **inerte** (rc-dock normalizza il figlio solo a 100%; `handleDockResize` è già guardato `>=2` → non scrive più). Nessuna perdita osservabile, nessuna pulizia obbligatoria.
- **Tab aperte / activeId / floatbox / maxbox**: il `LayoutData` rc-dock trasporterebbe `tabs[]` (id-only), `activeId`, `floatbox`/`windowbox`/`maxbox` (report agente §4), **ma** essendo il path di persistenza morto, **nulla di tutto ciò è salvato oggi**. La forma delle tab del gruppo editors è comunque hard-coded in `Dock.tsx` → rimuovendo il push spariscono per costruzione. Non c'è stato utente da preservare.

→ **Il "reset" non perde nulla che sia oggi effettivamente salvato.** È più semplice di un reset: è la rimozione di una costruzione statica.

---

# CONFERME DI CONTORNO

## C1 — Full-width (rimosso il figlio destro)

- **Viene strutturalmente gratis**: in un `dock-hbox` con **un solo** figlio, rc-dock gli assegna il 100% a prescindere dal suo `size` (peso relativo). Lo **dimostra già** la regola both-collapsed `abstract/style.scss:1158-1163` (`.dock-panel:first-child { flex:1; width:100%; max-width:100% }` quando il last-child va a 0). Rimuovendo davvero `children[1]` (B3), il figlio sinistro riempie **senza CSS nuovo**.
- **`calculatePanelSizes` NON va toccato** per ottenere il full-width: `leftSize` è un peso, ignorato con figlio unico. (Toccarlo sarebbe over-engineering.)
- **Assunzione `.editor-v2 height:100vh; width:100%`** (`EditorV2.scss:12-15`, report base A1 rischio #6): `width:100%` è relativa al pannello (diventa full-dockbox ✅); `height:100vh` è **viewport-relative** e resta un **quirk pre-esistente e ortogonale** alla larghezza (il canvas è già "alto quanto il viewport" a prescindere dall'altezza reale del suo pannello, ridotta da navbar+toolbar+statusbar). Il passaggio a full-width **non** introduce né risolve questo off-by-chrome verticale. **Da verificare a runtime in F2** (verifica visiva), ma non è un blocco strutturale del full-width orizzontale.

## C2 — Disposizione impilata (Tree sopra, Properties sotto)

**Struttura attuale** (`PropertiesWithTreeView.tsx` + `.scss`):
- `.properties-with-tree-view` (`scss:30-47`): `display:flex` (row implicito), `height:100%`, `width:100%`, `overflow:hidden`, backdrop card `#eef1f5`, `padding:10px 0` (solo verticale — orizzontale eccederebbe il width-lock), `position:relative`.
- **Ordine JSX**: `.properties-panel-container` **prima** (`:336-398`), `.tree-view-panel-container` **dopo** (`:405-442`). In flex-row → **Properties a sinistra, Tree a destra** (coerente col docstring "Left: Properties, Right: Tree"). *(NB: il prompt/report scrive "Tree|Properties" ma l'ordine DOM reale è Properties→Tree.)*
- Entrambi i container: `flex: 0 0 auto`, **width fissa inline** (`style={{width, minWidth, maxWidth}}`, Properties 400-700 default 440; Tree 200-500 default 260), `display:flex; flex-direction:column; height:100%`, card bianca con radius/shadow.

**Cosa cambia per impilare** (Tree sopra, Properties sotto):
1. `.properties-with-tree-view` → `flex-direction: column`.
2. Ordine: JSX rende Properties→Tree; per "Tree sopra" o si **riordina il JSX** o `flex-direction: column-reverse`.
3. Container: da **width** fissa a **height** fissa (uno fluido + uno fisso, o entrambi con altezze), `width:100%`. Le width inline (`:339`/`:408`) andrebbero convertite in height inline (o gestite via mode-scoped CSS).
4. **Due resize handle da riorientare**:
   - `.properties-panel-resize-handle` (`scss:106-113`): oggi `position:absolute; top:0; bottom:0; left:0; width:6px; cursor:col-resize; z-index:11`. Handler `handlePropsResizeStart` (`tsx:111-139`) usa `clientX`/delta-X.
   - `.tree-view-panel-resize-handle` (`scss:387-394`): oggi `left:-3px; width:6px; cursor:col-resize; z-index:10`. Handler `handleResizeStart` (`tsx:65-95`) usa `clientX`/delta-X.
   - Per impilato: handle sul bordo **orizzontale** di ciascuna card → `left:0; right:0; height:6px; cursor:row-resize`, linea `::before` da bordo-sinistro a bordo-alto/basso, e handler su `clientY`/delta-Y. **Tocca sia SCSS sia i due handler TSX.**

## C3 — Cluster di riapertura

- **Reso dock-independent già oggi**: `createPortal(<div.properties-tree-floating-cluster/>, document.body)` (`tsx:448-470`); CSS `position:fixed; top:150px; right:16px; z-index:900` (`scss:898-940`), variante dark `:943-956`.
- **Gating attuale** (due livelli):
  - **JS**: `showFloatingCluster = bothCollapsed && (activeEditorType==='model' || 'metamodel')` (`tsx:245-247`). `bothCollapsed = !showPropertiesPanel && !showTreePanel` (`:245`). `activeEditorType` dal context, alimentato da `EDITOR_TYPE_CHANGE` (`TreeViewPanelContext.tsx:203`), **dispatchato da `Dock.tsx:382`** dal `handleLayoutChange` del **pannello sinistro** (`children[0]`) → **sopravvive** alla rimozione del figlio destro (il gruppo canvas resta).
  - **CSS kill-switch**: `body[data-layout-mode="canvas-only"]` OR `body[data-active-tab="documentation"]` → `display:none` (`scss:961-963`). `data-layout-mode` da Navbar/Toolbar (sopravvive); `data-active-tab` da `Dock.tsx:390` (già gestito da F1).
- **Cosa serve per disaccoppiarlo dallo stato dock** (diventa "card nascosta → pill di riapertura"): il concetto **`bothCollapsed`** (i due sub-pannelli entrambi collassati) è **per-pannello** e diventa **obsoleto** nel mondo overlay (già segnalato report base B7). Serve un **nuovo stato "overlay visibile/nascosto"** a livello del componente overlay che (a) gate il render dell'intero overlay e (b) gate la pill di riapertura — sostituendo il gating `bothCollapsed`. `activeEditorType` resta utile come gate secondario (mostra l'overlay solo con canvas model/metamodel). **Design decision per F2** (vedi OQ).

---

# CRITICAL-ZONE (audit import file per file)

Critical-zone = import di `useJjomSync` / `portDistribution` / `editor-v2/sync/*`.

| File | Critical-zone? | Evidenza |
|------|----------------|----------|
| `App.tsx` | No | grep vuoto |
| `Dashboard.tsx` | No | grep vuoto |
| `Dock.tsx` | No | grep vuoto |
| `MyRcDock.tsx` | No | grep vuoto (agente + diretto) |
| `DockManager.tsx` | No | grep vuoto |
| `PropertiesWithTreeView.tsx` | No | grep vuoto |
| `TreeViewPanelContext.tsx` | No | grep vuoto |
| `VersionFixer.tsx` | No | grep vuoto (agente) |
| `joiner/classes.ts` (DProject/DUser layout) | No | grep vuoto (agente) |
| `api/persistance/users.ts` | No | grep vuoto (agente) |

**Tutta la catena dock + overlay + persistenza è critical-zone-free.** Come atteso. Nessuna eccezione da segnalare. → **Nessun LIR dovuto** per F2a/F2b (l'inset del fitView/minimap resta un capitolo separato in `EditorV2.tsx`, viewport-only, come da verdetto del report base).

---

# INJECTION POINT PROPOSTI

## F2a — Structural (mount overlay app-level)

1. **Nuovo mount host**: `ProjectDashboard` (`Dashboard.tsx:609-631`), un componente overlay sibling di `<Dock/>` (dentro `.project-dock-wrapper` o alla radice del fragment). Dentro Redux + `TreeViewPanelProvider` (A2).
2. **Nuovo mode `'floating'`** su `PropertiesWithTreeView`:
   - estendere `PropertiesWithTreeViewProps.mode` (aggiunta di un valore all'union — **§2 CLAUDE.md**: modificare un tipo esportato è ammesso solo per *aggiunta*; qui si aggiunge un membro all'union `mode`, additivo ✅).
   - estendere il gate render `:318` a includere `'floating'` (rende lo split).
   - lasciare il gate width-lock `:258` invariato (`'floating'` non scrive gli attr body del dock) — **A5**.
3. **Portal su body** dell'intero overlay (`position:fixed`, offset 8px, z ~900) — A4.
4. **Rimuovere** il call-site tab: `Dock.tsx:282` non renderà più `<PropertiesWithTreeView mode='tab'/>` (converge con F2b, che rimuove l'intero figlio destro).
5. **Disposizione impilata** (C2): `flex-direction: column` mode-scoped, width→height, 2 handle `col-resize`→`row-resize` (SCSS + i due handler TSX).
6. **Gating overlay** (C3): nuovo stato "overlay visibile" che sostituisce `bothCollapsed`; pill di riapertura riusando `.properties-tree-floating-cluster`.

## F2b — Reset layout (in realtà: single-panel dock)

1. **Injection point unico**: `Dock.tsx:337-348` — **non pushare** `children[1]` (il pannello editors). Il dockbox nasce single-child, full-width per costruzione (C1).
2. **Nessuna migrazione VersionFixer** (B1/B2): non c'è `DProject/DUser.layout` persistito da riscrivere.
3. **Nessuna pulizia obbligatoria** di localStorage (ratio inerte, B4). Opzionale.
4. **Corollari** (B3): `rightSize`/`groups.editors` orfani (lasciare); guard `>=2` già no-op.
5. **Width-lock retire** (report base B8): con il figlio destro rimosso e il mode `'floating'` che non scrive più gli attr body, i 5 retire-candidate del width-lock e i loro consumer CSS (`style.scss:1119-1168`) diventano ritirabili — **cleanup separato**, ordine writer+reader insieme come da B8.

---

# RISCHI

1. **Divergenza dei due gate `mode`** (A5): se F2a estende `:318` ma **non** verifica che `:258` resti escluso per `'floating'`, l'overlay scriverebbe attr body del dock inutili (e potenzialmente il both-collapsed CSS toccherebbe pannelli inesistenti). Rischio BASSO se si segue A5; MEDIO se improvvisato.
2. **Riorientamento resize handle** (C2): tocca sia SCSS sia i due handler TSX (`clientX`→`clientY`). Meccanico ma su 4 punti (2 SCSS + 2 handler); rischio MEDIO-BASSO, verificabile visivamente.
3. **Gating overlay ridefinito** (C3): sostituire `bothCollapsed` con "overlay nascosto" è design + codice; se mal fatto, l'overlay o la pill possono restare orfani (nessuno riapre). Rischio MEDIO — richiede la decisione di design (OQ).
4. **`.editor-v2 height:100vh`** (C1, rischio #6 pre-esistente): possibile off-by-chrome verticale a runtime; non introdotto da F2 ma **da verificare** nella verifica visiva.
5. **Lifecycle App-level** (se si sceglie il mount vicino a Jodie invece di Dashboard): richiederebbe gating route-level esplicito; rischio MEDIO — evitabile scegliendo il mount Dashboard (A3).

**Rischio #4 del report base (migrazione layout persistiti) → RIMOSSO** (B1: nessun layout persistito).

---

# DOMANDE APERTE PER ALFONSO

1. **Mount host**: `ProjectDashboard` (raccomandato, lifecycle=canvas) o app-level vicino a Jodie (persistente, richiede gating route)? (A3)
2. **Valore di `mode`**: nuovo `'floating'` (raccomandato, gate render/width-lock divergono puliti) o riuso di `'tab'` (attr body inerti)? (A5)
3. **Gating overlay** (C3): l'overlay è sempre visibile con canvas model/metamodel (come oggi il pannello), con una singola "pill di riapertura" quando dismisso? Oppure si mantiene la logica per-pannello (Properties/Tree collassabili indipendenti) *dentro* l'overlay, e la pill riapre l'intero overlay? Il concetto `bothCollapsed` va ritirato o riadattato?
4. **Disposizione impilata** (C2): confermato Tree **sopra**, Properties **sotto**? Una card fluida + una fissa (quale?), o due altezze fisse resizabili? Offset ratificato 8px, z ~900 — confermi?
5. **F2b timing**: F2a (mount overlay) e F2b (rimozione figlio destro) nello stesso commit o separati? (Sono convergenti: rimuovere il figlio destro senza l'overlay lascerebbe Properties irraggiungibile.)
6. **Width-lock retire** (report base B8): dentro F2 o cleanup separato dopo la conferma visiva dell'overlay?

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica ai sorgenti, nessun commit, nessun build. L'analisi prosegue in chat; F2 sarà spezzata in F2a (structural mount) + F2b (single-panel dock), preceduta dalla ratifica delle 6 OQ sopra. **Finding chiave da portare in chat: il rischio #4 (migrazione layout) è MOOT — la persistenza rc-dock è codice morto, F2b è la sola rimozione del push di `children[1]`.**
