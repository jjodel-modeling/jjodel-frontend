# Discovery Fase A — Harness di benchmark classic vs flow: verifica delle 4 assunzioni

**Data**: 2026-07-17
**Tipo**: Fase A del prompt "Benchmark baseline di rendering" (2026-07-17 18:18) — verifica read-only mirata. Contesto ampio: `discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md` §4-ter (hotspot [SOSPETTO] da misurare).
**Esito**: **hard stop condizionale NON scattato** — la generazione programmatica del progetto sintetico passa interamente da factory e azioni esistenti (precedente canonico: il path "Execute Transformation → Create Target Model" di `ProjectEditor.tsx:1485-1845`); nessuna modifica a file vietati, nessuna scrittura diretta nello store. Si procede con la Fase B.

File letti (path da `frontend/src/`): `components/abstract/tabs/EditorSwitch.tsx` (intero), `components/abstract/tabs/ModelTab.tsx:31-33/:68`, `components/abstract/DockManager.tsx:105`, `components/project/ProjectEditor.tsx:1004-1028/:1445-1845`, `pages/components/Navbar.tsx:70-113`, `model/logicWrapper/LModelElement.tsx` (firme factory DModel :4719/:4734, DPackage :1749, DClass :2667, DAttribute :4172, DReference :3813 + `set_upperBound` :1520, add-helper :1872-:3128, `setValueAtPosition` :7405, `set_values` :7534, `get_add` :6701), `model/dataStructure/GraphDataElements.tsx:1059/:1694`, `joiner/classes.ts:457/:567-592/:648-686/:947/:1298-1314`, `redux/reducer/reducer.ts:449-470`, `common/Defaults.ts:77-79`, `common/U.tsx:3322-3333`, `common/Geom.ts:677`, `components/editor-v2/EditorV2.tsx:3500-3560` (solo lettura), `components/editor-v2/hooks/useJjomSync.ts:282/:717-720/:773` (solo lettura), `graph/graphElement/graphElement.tsx:290/:344/:1281/:1471` (solo lettura), `common/UX.tsx:324`.

---

## Verifica 1 — Path canonico di creazione programmatica

**Precedente di riferimento (copiabile 1:1)**: `ProjectEditor.tsx:1485-1845` — crea M1 + grafo + N oggetti con posizioni a griglia + valorizzazione differita. Commento in loco `:1451`: "CREAZIONE MODELLO - NON USARE createM1!" (coerente con la regola 21 di CLAUDE.md).

**Ricetta per l'harness** (tutte le firme verificate verbatim):

- **M2**: `DModel.new(name, undefined, true, true)` (`LModelElement.tsx:4719`) → `SetFieldAction.new(project.id, 'metamodels', id, '+=', true)` (wiring **manuale**, vedi tabella) → `lM2.addChild('package')` → `lPkg.addClass('BenchNode')` (`:1882`) → `addAttribute('name', Defaults.Pointer_ESTRING)` / `addAttribute('flag', Defaults.Pointer_EBOOLEAN)` (`:3108`; costanti `Defaults.ts:77/:79`) → `addReference('next', benchClass.id)` (`:3126`; type omesso = self-reference, `:3814`) → **upperBound -1 NON è argomento di factory**: post-set via L-proxy `lRef.upperBound = -1` (`set_upperBound` `:1520`, clamp `Math.max(-1, val)`, TRANSACTION propria `:1526-1529`).
- **M1**: `DModel.new('BenchM1_<n>', dM2.id, false, true)` — il link M1→M2 è il 2° argomento `instanceoff`. Wiring manuale a `project.models` (`ProjectEditor.tsx:1555`).
- **Grafi (uno per editor)**: `DGraph.new(0, dM1.id, undefined, undefined, Constructors.DGraph_makeID(dM1.id))` (`GraphDataElements.tsx:1059`; makeID `classes.ts:1298-1301`) taggato `SetFieldAction … 'graphStyle', 'v2-flow'` (`ProjectEditor.tsx:1552`) per EditorV2, + un secondo `DGraph.new(0, dM1.id)` con `graphStyle` default `''` per il classic. **Selezione verificata**: il flow pesca `graphStyle === 'v2-flow'` (`useJjomSync.ts:282`), il classic filtra `graphStyle !== 'v2-flow'` (`ModelTab.tsx:68`) — nessuna ambiguità con due grafi.
- **Oggetti**: `DObject.new(benchClass.id, dM1.id, DModel, 'bench_<n>_<i>', true)` dentro la TRANSACTION di creazione modello (pattern ProjectEditor). Gli id ritornati sono temporanei (§9.1): la risoluzione avviene **per nome** nella fase differita.
- **Vertici (posizioni a griglia, entrambi gli editor)**: `DVertex.new(0, objectId, graphId, graphId, undefined, new GraphSize(x, y, w, h))` (`GraphDataElements.tsx:1694`; `GraphSize` `Geom.ts:677`) — **fuori da qualunque TRANSACTION** (§3.3; le factory aprono la propria via `Constructors.persist`, `classes.ts:648-686`), in loop nudo nella fase differita, per TUTTI E DUE i grafi (2N vertici). Nota: entrambi gli editor auto-creano i vertici mancanti (classic: `graphElement.tsx:290/:344`; flow: `useJjomSync.ts:773`) ma con posizioni di default — solo la creazione esplicita garantisce la griglia richiesta.
- **Valori (fase differita, §9.2)**: `setTimeout` dopo il settle → `lM1.objects.find(o => o.name === …)` → attributi `(lObj as any)['$'+name].value = v` (`ProjectEditor.tsx:1766-1769`) → reference multi-valore `feature.setValueAtPosition(i, targetId, {isPtr: true})` (`ProjectEditor.tsx:1810-1831`; firma `LModelElement.tsx:7405`). Catena (i→i+1) + collegamento lungo deterministico = ~2N valori.
- **Apertura tab**: `DockManager.open2(LModel.fromD(dM1.id))` (`DockManager.tsx:105`).

**Wiring automatico vs manuale** (verificato): root `state.m1models/m2models` AUTO (`classes.ts:947`); folder root da className AUTO (`reducer.ts:467-470`); `project.graphs` AUTO (`classes.ts:1313-1314`); **`project.models`/`project.metamodels` MANUALE** (`Navbar.tsx:100`, `ProjectEditor.tsx:1555`).

**Idempotenza**: il reject dei duplicati nel reducer è interamente commentato (`reducer.ts:452-465`); la guardia `Constructors.pending` è attiva solo in collaborative (`classes.ts:655-660`). **L'harness si auto-guarda**: se esiste già un DModel di nome `BenchM1_<n>` (scan idlookup), `setup(n)` riusa e riapre il tab senza ricreare.

## Verifica 2 — Rilevazione dell'editor attivo a runtime

Doppio canale, senza toccare EditorSwitch oltre il wrapper:
- **DOM (primario)**: i tre rami di render di EditorV2 (`EditorV2.tsx:3509-3546`) emettono marker esclusivi: `.editor-classic-only` (classic), `.editor-split-container` (split), altrimenti `.editor-v2__canvas` solo (flow). `detectEditorMode()` = querySelector in quest'ordine.
- **localStorage (cross-check)**: `jjodel.editorPrefs.${modelid}` → `editorMode` (`EditorSwitch.tsx:22-28`), registrato nel risultato.

**Vincolo scoperto (da riportare nelle istruzioni dei run)**: senza viewpoint attivo il toggle non esiste e il classic non è raggiungibile (`EditorSwitch.tsx:56` `hasViewpoint = !!viewpointId && !isMetamodel`; ramo `:111-121` scarta i children). I run richiedono **viewpoint Default attivo** dal selettore del Toolbar.

## Verifica 3 — Mount ri-triggerabile senza reload

**Sì, via toggle di modalità**: in modalità `classic` il canvas React Flow NON è nel tree (ramo `:3509-3517` renderizza solo `classicSlot`), in `flow` il classicSlot non è renderizzato → ogni toggle away-and-back **rimonta** l'editor di destinazione. Niente hard refresh, niente performance.mark persistito.

**Decisione (metrica mount)**: l'harness NON cambia modalità da solo (vincolo del prompt) — arma un watcher passivo: polling di `detectEditorMode()` (100ms); quando la modalità flippa via e poi torna a quella richiesta, t0 = primo commit del `<Profiler>` dopo il flip-back; fine = quiescenza commit (250ms senza commit) + doppio rAF. Il prompt in console guida Alfonso ("toggle all'altra modalità e ritorno, campione r/3"). Esclude la latenza input→primo commit (trascurabile e non catturabile senza hook sull'evento click).

## Verifica 4 — Target DOM per il MutationObserver

**Strategia robusta alle classi**: observer su `.editor-switch-stage` (subtree, childList + characterData) con predicato sul **testo**: la mutazione è riconosciuta quando il valore unico scritto (es. `bench_run_<t>_<i>`) appare nel textContent del nodo mutato. Nessuna dipendenza da classi CSS.
- Ancore disponibili se servisse restringere: classic `[data-nodeid]` (`graphElement.tsx:1281/:1471`, `UX.tsx:324`); flow `.react-flow__node[data-id]` (standard React Flow, usato da DynamicHandles).
- **Canale di mutazione scelto**: scrittura sullo **slot** `name` via proxy (`$name.value = v`) — canonico (§3.12: slot→name propaga con SetFieldAction diretto su `data.name`), e visibile in ENTRAMBI gli editor (classic: template default; flow: righe feature + label via propagazione). Timeout di guardia 10s → il sample viene marcato `timeout` (è un dato, non un errore).

## Rischi

1. **Durata del setup a 500 nodi**: ~500 DObject.new + 1000 DVertex.new + ~2000 scritture proxy, ciascuna col proprio dispatch async (`action.ts:349`) — il setup può richiedere decine di secondi/minuti. Non è misurato (solo le metriche lo sono); mitigazione: log di avanzamento in console e attese di settle con retry.
2. **Doppio grafo**: configurazione legittima ma poco battuta (di norma un modello ha un grafo per stile); se il classic auto-creasse comunque un terzo grafo, l'harness lo rileva (conteggio grafi nel risultato). Da osservare al primo run da 100.
3. **Il Profiler ha un costo proprio**: montato SOLO con `__jjodelBenchActive` — i numeri baseline includono l'overhead del Profiler in modo identico per entrambi gli editor (confronto interno valido; i valori assoluti sono leggermente pessimisti).
4. **N=3 su macchina singola**: mediana su 3 run, browser di Alfonso, no CI — limiti dichiarati nella baseline md.
5. **Toggle-driven mount**: se Alfonso attende troppo tra i due click del toggle il watcher resta armato (nessun timeout interno tra flip-away e flip-back oltre i 60s di guardia) — istruzioni esplicite nel prompt console.

## Domande aperte (non bloccanti)

- **Q-A1**: la raffica scrive 20 slot `name` di 20 oggetti distinti (più realistico del singolo slot riscritto 20 volte); quiescenza = ultimo valore visibile + 300ms senza mutazioni. Se si preferisce lo stesso slot 20 volte (worst case di coalescing), si cambia un parametro.
- **Q-A2**: il progetto sintetico resta nel progetto corrente (se si salva, persiste). Scelto di NON auto-cancellare: la pulizia è manuale (progetto scratch consigliato — già concordato in chat).

**Fine Fase A — si procede con Fase B (commit 1).**
