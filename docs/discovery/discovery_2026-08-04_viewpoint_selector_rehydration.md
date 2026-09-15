# Discovery 2026-08-04 — Rehydration del viewpoint selector

**Tipo**: discovery read-only, eseguita dalla sessione cloud (Cowork) sul working tree locale montato, HEAD `fc0af70d2`. Nessun file sorgente toccato. Il commit di questo report viaggia con la Fase 2 (il bridge non puo' completare commit: index.lock non rimovibile).

**Obiettivo**: chiudere la root cause del bug [ALTA] registrato il 2026-07-25 e mai piu' investigato: un viewpoint IR salvato non ricompare nel selector dopo reload del progetto; compare solo se creato in sessione via `DViewPoint.newVP`. Blocca il dogfooding (nessun ciclo salva-ricarica).

## File letti (path completi)

- `frontend/src/components/editor-v2/Toolbar.tsx` (:178-205, :418-436)
- `frontend/src/view/viewPoint/viewpoint.ts` (:38-46, `newVP`)
- `frontend/src/joiner/classes.ts` (:1248-1256 `Constructors.DViewPoint`, :2930-2975 `ProjectPointers`/`DProject`, :3365-3371 `set_viewpoints`)
- `frontend/src/redux/store.tsx` (:86 `DState`, :161 campo root `viewpoints`, :234-330 `init`/`init_editor`, default a id fissi)
- `frontend/src/redux/reducer/reducer.ts` (:100-235 op `'+='`/`'[]'`/skip su id duplicato, :455-490 push generico su root array, :505-541 `LoadAction`, :1095-1112 `defaultViewPointsMap`, :1355-1375 dispatch, :1478-1572 `stateInitializer`)
- `frontend/src/components/topbar/SaveManager.ts` (:31-58 `save`/`load`)
- `frontend/src/api/persistance/projects.ts` (:95-117 `save`, :337)
- `frontend/src/common/U.tsx` (:427-441 `compressedState`)
- `frontend/src/redux/VersionFixer.tsx` (:280-345 scrub `rootPointers`, :425-426)
- `frontend/src/utils/lastViewpoint.ts` (:34-57 `activateViewpoint`)
- `frontend/src/pages/Project.tsx` (:25-75), `frontend/src/components/project/ProjectEditor.tsx` (:1185-1215 creazione vp da UI)
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx` (:80-89), `frontend/src/components/editors/views/NestedView.tsx` (:543), `frontend/src/common/Dummy.ts` (:97)

## §1 La catena statica, sito per sito

**Creazione.** `DViewPoint.newVP` (`viewpoint.ts:38`) passa da `Constructors`. Due scritture distinte:
1. Generica, nel reducer: alla `CreateElementAction` il pointer del nuovo elemento viene appeso alla **root array derivata dal nome di classe** — `elem.className.substring(1).toLowerCase()+'s'` → `viewpoints` — via `SetRootFieldAction(statefoldername, elem.id, '[]')` (`reducer.ts:465-469`). L'op `'[]'` e' un append, non un replace (`reducer.ts:175-183`, condivide il ramo con `'+='`).
2. Specifica, nel costruttore: `Constructors.DViewPoint()` appende il pointer a **`project.viewpoints`** via `setExternalPtr(project.id, 'viewpoints', '+=')` (`classes.ts:1253`), solo se `LProject.getProject()` risolve.

Quindi ogni vp creato vive in **due liste**: root `state.viewpoints` e `project.viewpoints`.

**Selector (v2 Toolbar).** Legge la **root**: `useSelector(state => state.viewpoints)`, mappa ogni ptr con `LPointerTargetable.fromPointer` dentro try/catch e **filtra i null in silenzio** (`Toolbar.tsx:190-197`). Esiste dal 2026-03-29 (`e6dde5ad4`): era gia' questo il selector osservato il 2026-07-25.

**Save.** `SaveManager.save` → `ProjectsApi.save(project)` → `U.compressedState(dProject)` (`projects.ts:104`, `U.tsx:427-441`): copia **l'intero store**, filtra dall'idlookup solo gli altri `DProject`, serializza. La root `viewpoints` viaggia com'e' nel payload (`project.state`).

**Load.** `stateInitializer` (`reducer.ts:1478`): `DState.init()` → `init_editor` crea i due default **a id fissi** (`Defaults.Pointer_ViewPointDefault` / `_ViewPointValidation`, `store.tsx:323-327`) sullo stato iniziale → `await ProjectsApi.getOne` → `SaveManager.load(state, project)` (`reducer.ts:1570`) → `VersionFixer.update` → `LoadAction`.

**VersionFixer.** Lo scrub `rootPointers` (`VersionFixer.tsx:298-330`, `viewpoints` incluso a :326) usa `removeNullPtrs`: rimuove solo pointer **dangling** (target assente dall'idlookup). Nessun sito di VersionFixer azzera o ricostruisce `s.viewpoints` (:425-426 la itera soltanto).

**LoadAction.** `newState = action.value` (`reducer.ts:519`): **sostituzione integrale** dello stato. I default creati al boot spariscono e vengono rimpiazzati dai default omologhi salvati nello snapshot (stessi id fissi, per questo il reload "sembra" sempre sano).

## §2 Il finding centrale

**La catena statica non ha un buco.** Un vp creato (da console o da UI: `ProjectEditor.tsx:1193` usa lo stesso `newVP`) entra nella root array; il save serializza la root array com'e'; VersionFixer non la tocca se il target esiste; LoadAction la installa integralmente; il Toolbar la legge. Per costruzione statica, il vp salvato **dovrebbe** ricomparire.

Il bug osservato il 2026-07-25 e' quindi **runtime o data-dependent**, e la RCA di allora ("il selector non enumera i persistiti") descrive il sintomo, non il meccanismo. Serve una misura nello stato rotto, non altra lettura di codice.

## §3 Le quattro ipotesi discriminabili

- **H1 — Il pointer manca dalla root array caricata.** Perso al save (race con il commit async della create: `.fire()` dispatcha via `setTimeout(dispatch,0)`, `action.ts:569`) o perso dopo il load. In questo caso `project.viewpoints` diventa il discriminante secondario: se il ptr sta li' ma non nella root, la fonte canonica e' il progetto.
- **H2 — Il pointer c'e' ma il wrap fallisce.** `fromPointer` ritorna null o lancia sull'oggetto reidratato (plain JSON), il try/catch del Toolbar lo inghiotte e il filter lo elimina senza traccia.
- **H3 — La premessa del 2026-07-25 e' imprecisa.** La sonda di allora (`Object.keys(idlookup).filter(k=>k.indexOf('Pointer_CD')===0)`) matcha **anche le view** `Pointer_CD*`: puo' aver confermato la persistenza delle view mentre il **DViewPoint** non era mai stato salvato (save eseguito prima del flush async della create, o non eseguito).
- **H4 — Skip silenzioso su id duplicato al reinstall.** `CreateElementAction` su id gia' esistente viene **saltata in silenzio** (`reducer.ts:233-235`). La ricetta console documentata usa id fissi con hard-refresh per reinstallare: interazioni fra skip della create e derived push sulla root array possono produrre stati misti.

## §4 La sonda (60 secondi, read-only, da incollare in console nello stato rotto)

Aprire il progetto di test dopo hard-refresh, con il vp salvato che non compare, e incollare:

```js
(function(){
  const s = store.getState();
  const pid = (s.projects||[])[0];
  const proj = s.idlookup[pid] || {};
  const inLookup = Object.entries(s.idlookup)
    .filter(([k,v]) => v && typeof v === 'object' && String(v.className||'').includes('ViewPoint'))
    .map(([k,v]) => ({id:k, name:v.name, cls:v.className}));
  const root = s.viewpoints || [];
  const wrap = root.map(p => { try { const l = LPointerTargetable.fromPointer(p);
    return {p, ok: !!l, name: l && l.name}; } catch(e){ return {p, ok:false, err:String(e).slice(0,80)}; } });
  console.table(inLookup);
  console.log('[vpprobe]', JSON.stringify({root, projectVps: proj.viewpoints, wrap, activeVp: s.viewpoint}, null, 1));
})()
```

**Lettura dell'esito** (in ordine di check):
1. Il vp di test **non e' in `inLookup`** → H3: mai persistito; il bug e' nel ciclo save/create, non nel selector.
2. In `inLookup` ma **non in `root`** → H1: perdita sull'array; guardare subito `projectVps` per decidere la fonte canonica.
3. In `root` con **`wrap.ok:false`** → H2: fix nel wrapping o nel Toolbar.
4. In `root` con **`wrap.ok:true`** → il bug non riproduce piu' su HEAD: chiuderlo come stale e ritestare nel dogfooding.

## §5 Rischi e adiacenze scoperti (indipendenti dall'esito)

- **Doppia lista, doppia autorita', manutenzione asimmetrica.** Il Toolbar v2 legge la root `state.viewpoints`; il classic (`NestedView.tsx:543`) legge `project.viewpoints`. La delete rimuove dal progetto esplicitamente (`Dummy.ts:97`) e dalla root solo via cleanup generico del `pointedBy` (`reducer.ts:470`). Stessa forma del precedente noto `state.viewpoint` vs `project.activeViewpoint` (sessione 2026-06-10), un piano piu' su.
- **Il filtro del Toolbar e' un inghiottitore di errori**: qualunque failure di wrap sparisce senza log (`Toolbar.tsx:193-196`). Anche a bug risolto, un `console.warn` nel catch varrebbe la candela.
- **Create su id esistente = no-op silenzioso** (`reducer.ts:233-235`): l'idempotenza della ricetta console di install si regge su questo; nessun feedback distingue "creato" da "saltato".
- **Ordine del boot fragile per costruzione**: commento in `stateInitializer` (`reducer.ts:1568`) *"needs to stay before load for some reason? seems like action firing can be done synchronously some times?"*. Il fire async (`setTimeout(dispatch,0)`) rende l'ordine init/load dipendente dal timing; oggi regge perche' LoadAction sostituisce tutto, ma e' il primo posto dove guardare se la sonda da' esiti incoerenti fra run.
- `EditorSwitch.tsx:80-89` valida gia' il singolare stale contro la root plurale: qualunque fix che cambi la fonte del selector deve restare coerente con quel validatore.

## §6 Domande aperte per Alfonso

1. Esito della sonda (§4): quale dei quattro rami?
2. Se H1 con `projectVps` popolata: la fonte canonica del selector diventa `project.viewpoints` (come il classic) o si ripara la root al load? La prima unifica l'autorita', la seconda conserva il contratto attuale di `EditorSwitch`.
3. Il progetto di test del 2026-07-25 esiste ancora con CD2 dentro, o la sonda va fatta su un vp nuovo creato da UI (che e' anche il caso dogfooding)? Un vp nuovo da UI e' preferibile: prova il flusso reale.

## §7 Esito della verifica runtime (2026-08-04, chiusura)

Verifica eseguita da Alfonso sul flusso reale, che e' anche il caso dogfooding: viewpoint creato da UI, salvataggio esplicito, hard-refresh. **Il viewpoint ricompare regolarmente nel selector.** Ramo 4 della lettura di §4; la sonda non e' servita, l'evidenza end-to-end e' piu' forte.

Chiusura: il bug [ALTA] del 2026-07-25 si chiude come **non riproducibile sul flusso UI a HEAD `fc0af70d2`**, coerentemente con l'assenza di buchi nella catena statica (§1-§2). La causa dell'osservazione originale resta non identificata: con ogni probabilita' apparteneva alla ricetta console del testbed (id fissi + reinstall + skip silenzioso su id duplicato, H3/H4) o a un save mai flushato, non al prodotto. Nessun caso d'uso reale la esercita. Se il sintomo si ripresentasse nel dogfooding, la sonda di §4 discrimina in 60 secondi.

Il dogfooding e' sbloccato senza alcuna modifica al codice. Le adiacenze di §5 (doppia lista root/project, filtro inghiotti-errori del Toolbar, no-op silenzioso su id duplicato) restano registrate come debiti osservabili, nessuno bloccante.
