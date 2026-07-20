# Discovery — dot di conformance dipinto a 0×0: il tab-title vivo non è quello dipinto

**Data**: 2026-07-15
**Tipo**: Fase 1 discovery mirata (read-only). Precede il fix.
**Branch**: `alfonso-frontend-jjtl`
**Dossier runtime (input, misurato da Alfonso)**: `model_4` M1, due istanze `A_0/A_1` stesso valore su attributo `isID`. `validateConformance` diretto → `errors` + 2× `duplicate_id_value` (motore ok). `.conformance-indicator` **presente** nel DOM, unico, dentro il `.tab-title` di `model_4`, icona rossa corretta — **ma `getBoundingClientRect() = 0×0 @ (0,0)`** (subtree non dipinto). Il label visibile "model_4" nella tab bar non mostra il dot; né remount né edit lo fanno comparire.

---

## Obiettivo

Capire perché il subtree React del titolo (con `ConformanceIndicator` e i suoi hook) è dipinto a 0×0 mentre la tab bar mostra un'altra rappresentazione senza dot; individuare il nodo/ scrittura responsabile e il fix path. Nessun edit in questa fase.

---

## File letti

- `frontend/src/components/abstract/tabs/TabDataMaker.tsx` (titoli tab: model `:29`, metamodel `:19`, doc `:46`)
- `frontend/src/components/dock/MyRcDock.tsx` (`TabHeader` `:127-150`, `MyPortal`/`tabdict_title` `:139,:149,:221,:337,:351`, save/load `:680-730`, `loadTab` commentato `:292`)
- `frontend/src/components/dock/MyDock.tsx` (`MyPortal` `:13-36`)
- `frontend/src/components/abstract/Dock.tsx` (editor tab via `TabHeader` `:281-294`, dock creato senza `loadTab` `:398`, JSON round-trip layout `:190-199`, lettura `title.props` `:361`)
- `frontend/src/components/abstract/DockManager.tsx` (`open2 :105`, `open :91-102`, `updateTab(id,null,true) :98`, jjtl tab `:336`)
- `frontend/src/components/abstract/tabs/tab-title.scss` + `frontend/src/components/dock/DockManagerStyles.scss` (`:266-268`)
- `frontend/src/components/dock/TabsOverflowMenu.tsx` (`:13-53`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`LModel.set_name` `:5365-5382`)
- rc-dock/rc-tabs (`node_modules/rc-dock/lib/{DockTabs,Serializer,Algorithm,DockLayout}.js`, `rc-tabs/lib/TabNavList/TabNode.js`) per capire chi dipinge il label

---

## Risposte alle 4 domande

### Q1 — Come arriva `tab.title` a rc-dock e chi dipinge il label visibile
**I tab modello hanno titolo plain-div, MAI `TabHeader`.** `TabDataMaker.model` costruisce `title: <div className="tab-title active-on-mouseenter" data-type="model">{model.name}<ConformanceIndicator/></div>` (`TabDataMaker.tsx:29`). Gli editor tab, invece, avvolgono il titolo in `<TabHeader tid=…>` (`Dock.tsx:281-294`); i tab model/metamodel/doc **no**.
- Apertura: `DockManager.open2 :105` → `open('models', tab) :91` → `dockMove(tab, dockbox.children[0], 'middle') :102` — add ordinario **non-pinned**. `state.pinned` si setta **solo** col drag-to-anchor (`confirmSetAnchor → title.setState({pinned}) MyRcDock.tsx:356`).
- Poiché il titolo è un plain div (non un `TabHeader`), **non gira nessuno dei due rami di `TabHeader.render`**: né il diretto non-pinned (`MyRcDock.tsx:136`) né il `MyPortal container={tabdict_title[tid+'_pinned']}` pinned (`:149`). Tutto il meccanismo `tabdict_title`/`MyPortal`/`.moved-content` **è irrilevante per i tab modello** (l'ipotesi portale era sbagliata).
- **Chi dipinge il label**: rc-dock direttamente. `TabCache.render` (rc-dock `DockTabs.js`) mette `title` dentro `.drag-initiator[role=tab]`; `rc-tabs TabNode` (`TabNode.js:66-91`) lo renderizza dentro `.dock-tab-btn` con `id="rc-tabs-2-tab-{model.id}"`. DOM dipinto: `.dock-tab-btn#rc-tabs-2-tab-{id} > .drag-initiator > .tab-title.active-on-mouseenter`.

### Q2 — L'ancestor che nasconde l'indicator
**Non è CSS.** Lettura integrale di `tab-title.scss` + grep del SCSS dock: **nessun** `display:none`/`visibility:hidden` su `.tab-title`/`.conformance-indicator`/tab inattivi. L'unico `display:none` rilevante è `DockManagerStyles.scss:266-268` `.dock-tab:has(.moved-content){display:none}` — nasconde il placeholder d'origine di un tab **pinned via TabHeader**; i tab modello non producono `.moved-content`, quindi non si applica.
**È detachment.** `0×0 @ (0,0)` con visibility/opacity ok è la firma di un nodo il cui ancestor **non è nel documento vivo**: il subtree `.tab-title` che React possiede è **fuori documento** dopo la scrittura foreign-DOM (vedi Root cause). Non è nascosto da stile, è staccato.

### Q3 — `MyPortal` e il percorso save/restore
- **`MyPortal`** (`MyDock.tsx:13-36`) è istanziato **solo** da `TabHeader`/`TabContent` (`MyRcDock.tsx:149,:170`). I tab modello non ne costruiscono → non muove l'indicator.
- **Il restore NON fabbrica un titolo-stringa.** Il dock è creato con `defaultLayout` e **senza prop `loadTab`** (`Dock.tsx:398`). Con `loadTab` undefined, `Serializer.loadLayoutData` ritorna il `TabData` vivo dalla cache o `null` — **non** crea mai `title:"model_4"`. Ipotesi "restore → titolo stringa" **falsa**.
- **Hazard collaterale (non questo bug)**: il layout-mode handler fa `loadLayout(JSON.parse(JSON.stringify(currentLayout)))` (`Dock.tsx:190-199`): il round-trip JSON strippa i titoli-ReactElement e, poiché i tab modello aperti dinamicamente non sono nella cache di `defaultLayout`, verrebbero **droppati**. Difetto latente separato, non la causa del label-senza-dot.
- `updateTab(id, null, true)` (`DockManager.open :98`, overflow menu) **preserva** il titolo esistente (`DockLayout.js:289`), non lo stringifica.

### Q4 — Tab metamodel e altri consumatori del titolo
**La patologia è specifica dei tab modello**, perché il titolo modello è l'unico con un **figlio React distruggibile**:
- metamodel `TabDataMaker.tsx:19` — solo `{model.name}` (badge CSS `::before`) → `textContent=val` innocuo;
- documentation `:46` — solo testo → innocuo;
- model `:29` — testo **+** `<ConformanceIndicator>` (figlio DOM reale) → `textContent=val` lo distrugge → **il bug**.
- Metamodel e model passano dallo **stesso** `LModel.set_name` (`:5365`), quindi entrambi subiscono la scrittura `textContent`, ma solo il model ha un figlio da perdere. (I tab jjtl `DockManager.tsx:336` hanno un `<i>` figlio ma id `jjtl_{id}` e non sono rinominati via `LModel.set_name` → non colpiti.)
- **Altri consumatori del titolo** (tutti leggono il ReactElement o Redux, non il DOM mutato → restano coerenti): `Dock.tsx:361` (`title.props['data-type']`), `TabsOverflowMenu.tsx:13-53` (ricorsione sui children del ReactElement), `StatusBar` (dati Redux). **Solo `LModel.set_name` è accoppiato al DOM del titolo.**

---

## ROOT CAUSE

`LModel.set_name` (`LModelElement.tsx:5365-5382`) mescola contenuto gestito da React (`<ConformanceIndicator>` nel titolo) con una **scrittura DOM imperativa esterna**. Quando il nome del modello viene committato, dopo il write D-layer (`TRANSACTION`+`SetFieldAction :5374-5376`) esegue:
```ts
// :5377-5379
let tab = document.querySelector('#rc-tabs-2-tab-'+c.data.id+' > .drag-initiator > .active-on-mouseenter');
if (tab) tab.textContent = val;
```
`textContent =` **cancella tutti i figli** del `.tab-title` dipinto e inserisce un unico text node — volutamente, per far sopravvivere il badge CSS `::before` (handover tab-icon 2026-01-24) — ma **distruggendo lo span `.conformance-indicator` renderizzato da React**. Questo **desincronizza il fiber React** (che continua a possedere/aggiornare un `.tab-title` con dentro l'indicator) dal nodo DOM che rc-dock dipinge: React ri-renderizza l'indicator nel proprio `.tab-title` ormai **fuori documento** (→ "esiste nel DOM ma misura 0×0"), mentre la tab bar dipinge il text node foreign "model_4" senza dot.

(Alta confidenza sulla collisione e sullo split a due rappresentazioni: `LModel.set_name:5379` è **l'unico** writer foreign-DOM verso `.active-on-mouseenter` nel codebase. La topologia esatta del subtree fuori documento è un dettaglio di reconciliation da confermare in-browser, ma il writer causale è inequivocabile.)

**Nota §3.12**: `set_name` qui è quello di **`LModel`** (nome del modello → label del tab), non il binding identità M1 slot↔name della §3.12. La scrittura DOM (`:5377-5379`) è **separabile** dal `SetFieldAction` sul campo `name` (`:5375`): rimuoverla lascia intatto il write D-layer e non tocca l'invariante identità.

---

## FIX PATH (senza implementare)

Il write DOM esiste solo perché `{model.name}` nel titolo (`TabDataMaker.tsx:29`) è uno **snapshot** catturato alla creazione del tab, e rc-dock (`TabCache`) ri-renderizza il titolo **solo** quando cambia il reference dell'oggetto `TabData` — quindi al rename il nome va aggiornato in altro modo. La cura è eliminare la scrittura foreign-DOM e rendere il nome reattivo, così il `.tab-title` **dipinto** resta il subtree React che contiene `ConformanceIndicator`.

**Opzione A — consigliata (robusta), ~2 file (+1 mini-componente opzionale):**
1. `TabDataMaker.tsx:26-34` — sostituire il raw `{model.name}` con uno span reattivo Redux-subscribed (es. `<ModelTabName modelId={model.id}/>`), tenendo `<ConformanceIndicator>` come sibling. Così l'intero titolo resta React-owned e il nome si aggiorna al rename.
2. `LModelElement.tsx:5377-5379` — rimuovere `querySelector(...) + tab.textContent = val`. Rimozione **solo** di queste righe; non toccare `TRANSACTION`/`SetFieldAction` circostanti (regione sensibile §3.12).

**Opzione B — blast-radius minimo, 1 file:** mantenere l'update imperativo ma renderlo chirurgico a `:5379` — scrivere sul `nodeValue` del **primo text node** del titolo invece di `textContent`, lasciando intatto il figlio `.conformance-indicator`. Meno pulito (continua a "combattere" React sul text node, e resta l'accoppiamento al `#rc-tabs-2` hardcoded), ma tocca una riga.

**Vincolo rispettato**: nessun cambiamento a `ConformanceIndicator.tsx`/`useConformance.ts` (funzionano; il bug è puramente il conflitto di ownership DOM del titolo).

---

## Valutazione del GATE

Gate del prompt: "se il fix richiede cambi invasivi al layer dock (più di 3 file, o modifica del formato di persistenza del layout) → STOP AND ASK".
- Opzione A: **2 file** (`TabDataMaker.tsx`, `LModelElement.tsx`) + al massimo 1 mini-componente nuovo. Nessuna modifica al formato di persistenza del layout. → **gate NON scatta.**
- Opzione B: **1 file** (`LModelElement.tsx`). → gate non scatta.
Nessuno dei due tocca `MyRcDock.tsx`/il formato layout. Il fix resta fuori dalla zona invasiva del dock.

**Cautela residua**: entrambe toccano `LModelElement.tsx` vicino alla regione identità §3.12 → edit chirurgico, solo le righe DOM, con verifica typecheck/build. Opzione A tocca anche `TabDataMaker.tsx` (fuori critical zone).

---

## Domande aperte / decisioni per Alfonso

1. **Opzione A (pulita, nome reattivo, ~2-3 file) vs Opzione B (1 riga chirurgica)?** A elimina il debito dell'accoppiamento DOM e del `#rc-tabs-2` hardcoded; B è minima ma lascia il fragile querySelector.
2. **Dove eseguire la Fase 2**: qui (contesto diagnostico caricato) o chat nuova (come suggerito). Il gate non scatta, quindi la Fase 2 potrebbe procedere nello stesso task.

---

## Hard stop

Nessun edit in questa fase (solo questo report). La Fase 2 (fix) parte dopo la scelta A/B e la conferma su dove eseguirla.
