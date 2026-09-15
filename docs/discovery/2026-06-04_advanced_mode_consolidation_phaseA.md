# Phase A - Consolidamento Advanced Mode (discovery + Layer Impact Report)

**Tipo**: discovery read-only, hard stop. Fase A del task "single source of truth (Store B) + bridge + boot hydration".
**Branch**: `alfonso-frontend-jjtl`
**Data**: 2026-06-04
**Riferimento**: `docs/discovery/2026-06-03_advanced_mode_audit.md` (mappa completa dei due store).

> Decisione architetturale (presa, non rediscussa qui): **Store B (localStorage `jjodel.interfaceMode` + `U.interfaceMode`) e' la sorgente di verita'**. Store A (Redux `state.advanced`) diventa mirror derivato con un solo writer (il bridge). I reader di A non si toccano.

---

## TL;DR per la Fase B

1. **Bridge B -> A**: montare un listener `INTERFACE_MODE_CHANGE` una volta per sessione in `App.tsx` (useEffect `[]` nel componente root). Handler: `SetRootFieldAction.new('advanced', mode === 'advanced')`. Loop-safe (vedi p.5).
2. **VINCOLO CRITICO (propagazione)**: il bridge si aggiorna **solo** su `INTERFACE_MODE_CHANGE`, evento emesso **solo** da `useInterfaceMode.toggleMode/updateMode` (`useInterfaceMode.ts:87,96`). I 3 writer "full-sync" (Navbar/BottomBar/ProfileSection) e `LockedFeature` **non** lo emettono oggi. In Fase B ogni writer deve passare per un path che emette l'evento, altrimenti B cambia e A non segue. `setInterfaceMode()` da solo NON emette (`useInterfaceMode.ts:34-38`).
3. **TIMING CRITICO (hydration)**: `Action.fire()` dispatcha via `setTimeout(dispatch, 0)` (`action.ts:340`), quindi **asincrono**. `LoadAction` (full state replace) applica su un macrotask **dopo** che `stateInitializer()` ha risolto. Una hydration ingenua nel `.then()` di `App.tsx:94` (microtask) verrebbe **sovrascritta** dal LoadAction successivo. Vedi p.2 per i due punti di hydration corretti.
4. `windoww.advanced`: **0 reader** (solo 4 write). Candidato rimozione, **fuori scope** in questo task.

---

## 1. Writer esatti e cosa scrivono oggi (confermato)

| Writer | file:linea | Scrive A (`state.advanced`) | Scrive B (localStorage/U) | Emette `INTERFACE_MODE_CHANGE`? |
|---|---|---|---|---|
| Navbar enable/disable (menu + Cmd+Shift+M) | `Navbar.tsx:838-866` | si (`:839,853`) | si (`:841-842,855-856`) | **NO** (write manuale) |
| BottomBar `ModeIndicator` | `BottomBar.tsx:54-58` | si (`:55`) | si (`:57-58`) | **NO** (write manuale) |
| ProfileSection (Settings) | `ProfileSection.tsx:366-369` | si (`:366`) | si (`:368-369`) | **NO** (write manuale) |
| StatusBarRightZone | `StatusBarRightZone.tsx:25` | NO | si (via `toggleMode`) | **si** |
| ModeSystem `ModeToggle` | `ModeToggle.tsx:23` | NO | si (via `toggleMode`) | **si** |
| ModeSystem `UpgradePrompt` | `UpgradePrompt.tsx:46` | NO | si (via `setMode`/`updateMode`) | **si** |
| ModeSystem `LockedFeature` | `LockedFeature.tsx:40-42` | si (`SetRootFieldAction`) | NO | **NO** |

**Implicazione Fase B**: per far funzionare il bridge, i 4 writer che oggi non emettono l'evento (Navbar, BottomBar, ProfileSection, LockedFeature) devono essere reinstradati su `useInterfaceMode.updateMode`/`toggleMode` (che fa `setInterfaceMode` + dispatch evento), oppure su un helper che esegua `setInterfaceMode(mode)` + `window.dispatchEvent(new CustomEvent(SystemEvents.INTERFACE_MODE_CHANGE, {detail:{mode}}))`. Smettere di scrivere `state.advanced` direttamente in tutti e 4. ProfileSection/BottomBar/Navbar sono connessi (leggono `state.advanced` via mapStateToProps): dopo il reinstradamento continueranno a ri-renderizzare perche' il bridge aggiornera' A. `LockedFeature` ha gia' `useInterfaceMode` importato (`LockedFeature.tsx:9`) -> reinstradamento banale.

---

## 2. Punto di boot + sequenza di inizializzazione + hydration

### Sequenza reale (project page)
1. `App()` primo render -> `firstLoading` -> `stateInitializer()` (`App.tsx:92-101`), ritorna `<Loader/>`.
2. `stateInitializer()` (`reducer.ts:1460`): `DState.init()` crea lo state con default `advanced=false` (`store.tsx:220`).
3. Project page: fetch progetto, `state = JSON.parse(decompressState(project.state))`. **Il payload contiene `advanced`**: `U.compressedState` serializza `{...store.getState()}` intero (`U.tsx:429`), filtra solo `idlookup`/`projects`, **non** i root field -> `advanced` fa round-trip.
4. `SaveManager.load(state, project)` (`reducer.ts:1552` -> `SaveManager.ts:41`): `save = VersionFixer.update(save)`; `LoadAction.new(save)` (`SaveManager.ts:57`).
5. `LoadAction` reducer (`reducer.ts:517-534`): `newState = action.value` -> **sostituzione integrale dello state**, incluso `state.advanced` = valore salvato nel progetto.

**Quindi**: il modo Advanced finisce per essere deciso dal progetto caricato, non dalla preferenza utente. E' esattamente cio' che la decisione architetturale vuole eliminare: la hydration da Store B deve **prevalere** sul valore caricato.

### Il timing rende il `.then()` di App.tsx inadatto
`Action.fire()` (`action.ts:319-358`) non dispatcha sincrono: fuori da una TRANSACTION fa `setTimeout(()=>storee.dispatch({...this}), 0)` (`action.ts:340`); dentro una TRANSACTION accoda in `t.pendingActions`. Conseguenza ordini:
- `stateInitializer()` chiama `SaveManager.load` (che **schedula** il dispatch del LoadAction su setTimeout 0) e poi risolve.
- `App.tsx:94` `stateInitializer().then(cb)` -> `cb` e' un **microtask**, gira **prima** del `setTimeout(0)` del LoadAction (**macrotask**).
- Una `SetRootFieldAction('advanced', ...)` lanciata in `cb` verrebbe dispatchata (anch'essa setTimeout 0) e poi **clobberata** dal LoadAction che la segue.

### Due punti di hydration corretti (coprono i due path di pagina)

Il modo va idratato sia in project page (dove il LoadAction sovrascrive) sia in dashboard page (dove NON c'e' LoadAction e `advanced` resta al default `false`).

- **Project path - opzione raccomandata (race-free)**: in `SaveManager.load`, **prima** di `LoadAction.new(save)` (`SaveManager.ts:57`), forzare `save.advanced = isAdvancedMode()` (da `useInterfaceMode.ts:43`). Il valore corretto entra atomicamente nello state di sostituzione: nessuna corsa, nessun doppio dispatch. `SaveManager.load` e' chiamato **solo** in project load (`reducer.ts:1552`) -> non copre la dashboard.
- **Dashboard path**: nessun LoadAction da sovrascrivere, quindi un singolo dispatch a boot e' sufficiente e non viene clobberato. Va bene `App.tsx` `.then()` (microtask) **oppure** lo stesso bridge se lo si fa auto-idratare all'avvio.
- **Alternativa unificata (un solo meccanismo)**: registrare la hydration via `AFTER_TRANSACTION(cb)` (`action.ts:235`, gia' usato nel load path a `reducer.ts:1531`), che gira **dopo** l'applicazione del LoadAction. `cb` fa `SetRootFieldAction.new('advanced', isAdvancedMode())`. Copre entrambi i path con un punto solo, al prezzo di un dispatch extra dopo il load (accettabile). Questa e' la via piu' lineare se si vuole evitare di toccare `SaveManager.ts`.

### Mount del bridge
`App.tsx` componente root (sempre montato, vive per tutta la sessione): `useEffect(() => { const h = (e) => SetRootFieldAction.new('advanced', e.detail?.mode === 'advanced'); window.addEventListener(SystemEvents.INTERFACE_MODE_CHANGE, h); return () => window.removeEventListener(...); }, [])`. Nota: `App` e' avvolto in molti provider ma il bridge non dipende da nessuno; va bene anche un piccolo provider/componente dedicato montato in `App.tsx`.

**Decisione aperta per Alfonso** (da chiudere prima della Fase B):
- (H1) hydration in `SaveManager.load` (project, race-free) + boot dispatch per dashboard -> 2 punti, ma il project path e' atomico. Scope: `SaveManager.ts` + `App.tsx`.
- (H2) hydration unica via `AFTER_TRANSACTION` -> 1 punto, copre entrambi, un dispatch extra post-load. Scope: solo `App.tsx` (o dove si registra l'AFTER_TRANSACTION).

Raccomandazione: **H2** se si vuole minimizzare lo scope e tenere tutto in `App.tsx`; **H1** se si preferisce zero-race assoluto sul project path. Entrambe richiedono comunque il bridge in `App.tsx` e il reinstradamento writer del p.1.

---

## 3. `windoww.advanced`

Grep esaustivo (`windoww.advanced` / `window.advanced`): **4 occorrenze, tutte write** (`ProfileSection.tsx:367`, `Navbar.tsx:840,854`, `BottomBar.tsx:56`). **Nessun reader** in tutto `frontend/src`. E' un mirror morto.

-> Candidato rimozione, ma **fuori scope** in questo task (cleanup separato su decisione di Alfonso). In Fase B: i writer che oggi lo scrivono vanno reinstradati su B; nel farlo si puo' semplicemente **smettere di scriverlo** (non aggiungerlo al nuovo path), senza rimuovere la dichiarazione globale. Non introdurre nuove scritture.

---

## 4. Trigger di `AdvancedModeTutorial`

- Catena: `Navbar.enableAdvancedMode(showTutorial=true)` (`Navbar.tsx:838-849`) -> se `shouldShowAdvancedModeTutorial()` (`AdvancedModeTutorial.tsx:151`, legge `localStorage['jjodel_advanced_mode_tutorial_seen']`) -> `setShowAdvancedTutorial(true)` -> modale `<AdvancedModeTutorial>` (`Navbar.tsx:1985`).
- La chiave del tutorial e' **distinta** da `jjodel.interfaceMode`; il consolidamento non la tocca.
- **Dipendenza da preservare in Fase B**: il tutorial e' agganciato all'evento "enable" lato Navbar, non al cambiamento dello store. Se in Fase B Navbar smette di chiamare `enableAdvancedMode()` e passa a `useInterfaceMode.updateMode('advanced')`, il check del tutorial va **mantenuto sul medesimo gesto** (cioe' il path "enable da Navbar" deve continuare a invocare `shouldShowAdvancedModeTutorial()` + `setShowAdvancedTutorial`). Non spostare il trigger nel bridge ne' negli altri writer (StatusBar/BottomBar oggi non mostrano il tutorial; preservare questa asimmetria salvo diversa indicazione). Smoke test 4 verifica "primo enable -> tutorial una sola volta".

---

## 5. Rischio loop (confermato assente)

`SetRootFieldAction` (`action.ts:403-476`, reducer `reducer.ts:536`) **non** emette `INTERFACE_MODE_CHANGE`. L'evento e' dispatchato **solo** da `useInterfaceMode.ts:87,96`. Grep globale conferma 0 altre emissioni. Quindi: bridge riceve evento -> `SetRootFieldAction('advanced')` -> reducer aggiorna A -> **nessuna ri-emissione** -> nessun loop. Invariante da preservare in Fase B: l'evento resta emesso solo da `useInterfaceMode`; il bridge non deve ri-emetterlo.

---

## 6. Verifiche di classificazione (gratis, per la spec basic/advanced)

- **Sezione "ADVANCED" su feature** (`Info.tsx:431`, gated `state.advanced`): contiene i toggle `unique`, `ordered`, `changeable`, `volatile`, `transient`, `unsettable`, `derived`, `allowCrossReference` (tutti advanced-only). Su attribute si aggiunge la sezione "FLAGS" (`isID`, `isIoT`, `Info.tsx:454`).
- **Editing di `abstract` su classe**: `Info.tsx:116`, dentro `InheritanceSection` -> sezione "INHERITANCE", **NON** gated da advanced -> sempre visibile in Basic (idem `interface`, `:119`). Le sole parti advanced di quella sezione sono "Extends" (`:121`, Store A) e "Allow cross-extend" (`:133`, Store B).
- **Editor di view raggiungibile in Basic?** Sostanzialmente **no**: tab **Node** spinto solo se advanced (`Dock.tsx:352`); editor Viewpoints (`NestedView`) mostra `LockedFeature` in basic (`NestedView.tsx:472`). `InfoData` (ViewData, gating Edge guidato dal dominio `view.isEdge`) di fatto si raggiunge solo in Advanced, pur non leggendo il flag. Da tenere presente nella spec: classificare "view editing" come advanced e' coerente con lo stato attuale.

---

## LAYER IMPACT REPORT

```
Layers touched (previsti in Fase B):
  [x] D-layer (Redux raw data)  -> solo il root field `state.advanced`, via UN solo writer (bridge)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)         -> NON toccato
  [ ] Persistence (VersionFixer / jsxString) -> NON toccato (nessun cambio a default-view; vedi nota sotto)
  [x] App boot / store init                  -> bridge listener + hydration
  [x] UI writers                             -> Navbar/BottomBar/ProfileSection/LockedFeature reinstradati su Store B
```

**D-layer (`state.advanced`)**
- Cosa cambia: smette di avere 4 writer eterogenei; ne ha **uno solo** (il bridge, su `INTERFACE_MODE_CHANGE`). Il valore e' derivato da Store B.
- Cosa NON cambia: la **forma** del campo (`boolean`), il default (`false`), e **tutti i reader** di `state.advanced` (Dock, PropertiesWithTreeView, Info, Console, CollapsibleShortcuts, NestedView, Navbar/BottomBar/ProfileSection mapStateToProps). Restano intatti.
- Interazione cross-layer: nessuna verso sync/L/JjOM. `advanced` non e' letto da useJjomSync ne' da canvasToJjom (grep p.3 audit precedente).

**App boot / store init**
- Cosa cambia: aggiunta di (a) un listener globale di sessione e (b) una hydration una-tantum post-load.
- Ordine di boot: la hydration deve girare **dopo** il LoadAction (async, setTimeout 0). Punti validi: `save.advanced` pre-LoadAction in `SaveManager.load` (atomico) oppure `AFTER_TRANSACTION` post-load. Il `.then()` di `App.tsx:94` da solo **non** e' valido per il project path (microtask prima del macrotask LoadAction).
- Doppio dispatch: con H2 (AFTER_TRANSACTION) c'e' un `SetRootFieldAction` extra dopo ogni project load. Costo trascurabile (un root field, nessun ricalcolo L). Con H1 (pre-LoadAction) **zero** dispatch extra sul project path.
- Interazione con project load: la hydration **vince** sul valore serializzato nel progetto. Effetto voluto: il modo torna a essere preferenza utente, non stato di progetto (coerente con l'esclusione collaborativa `Collaborative.ts:24`).

**Persistence**
- Nessun file di default-view (`DV.tsx`, `defaultViewTemplate.ts`) toccato -> **nessuna VersionFixer migration richiesta**. Nota: `advanced` continuera' a essere serializzato dentro `project.state` (la save non viene modificata), ma diventa **inerte** al load perche' la hydration lo sovrascrive. Non serve ripulire i progetti salvati; non serve bump di versione.

**Smoke-test scenari potenzialmente affetti**
- Toggle da StatusBar -> i gate Redux (tab Node, sezione NODE, sezioni ADVANCED di Info) reagiscono subito senza reload (oggi non lo fanno).
- Reload progetto salvato in Advanced -> il modo riflette la **preferenza utente** (localStorage), non il valore del progetto.
- Apri progetto -> le view renderizzano (nessun impatto: `advanced` non entra nella pipeline view).
- Save -> reopen -> stato identico lato modello; `advanced` derivato da localStorage.

**Incertezze sulla propagazione**: nessuna verso il critical zone (sync/D-L/L). L'unico punto delicato e' il **timing del boot** (async dispatch), mappato sopra con due soluzioni concrete. Nessun hard stop §3 innescato (nessuna TRANSACTION sync-adjacent, nessun DVoidEdge, nessun default-view).

---

## Decisioni aperte da chiudere prima della Fase B

1. **Hydration**: H1 (SaveManager.load pre-LoadAction + boot per dashboard) vs H2 (AFTER_TRANSACTION unico). Raccomandato H2 per scope minimo, H1 per zero-race assoluto.
2. **Reinstradamento writer**: usare direttamente `useInterfaceMode.updateMode`/`toggleMode` nei 4 writer, oppure introdurre un helper unico `setMode(mode)` (= `setInterfaceMode` + dispatch evento) richiamato da tutti. Quest'ultimo riduce la duplicazione e garantisce che l'evento sia sempre emesso.
3. **`windoww.advanced`**: confermare che resta dichiarato (solo si smette di scriverlo) e che la rimozione e' un task separato.

---

## File toccati in questa fase

Solo questo report e l'entry in `docs/claude-code-log.md`. **Nessun file di codice e' stato modificato.**
