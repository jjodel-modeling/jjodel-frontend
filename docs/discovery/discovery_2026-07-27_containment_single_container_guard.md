# Discovery READ-ONLY — guard single-container su riferimenti containment

**Data**: 2026-07-27. Sessione **read-only** su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`, HEAD `420657f98` (+ WIP locale). Nessun file sorgente modificato. Uniche scritture: questo report.

**Obiettivo (Fase 1, discovery)**: mappare come il modello scrive uno slot di riferimento, se distingue containment, se un oggetto conosce il proprio contenitore, quali punti di ingresso possono creare il containment condiviso, come si riproduce il bug, quale canale di feedback esiste per "blocca e spiega", e se esiste già enforcement di invarianti containment. **Nessuna implementazione.** Decisione architetturale già presa (da progettare in Fase 2): scrittura di uno slot containment che darebbe un secondo contenitore all'elemento → **respinta** (no auto-move), UI spiega il motivo.

---

## SINTESI ESECUTIVA — il finding che ribalta l'inquadramento

> **Il modello GIÀ impone il vincolo single-container, ma con la policy OPPOSTA a quella decisa: un AUTO-MOVE silenzioso, non un blocco.** In `LValue.setValueAtPosition` (`LModelElement.tsx:7477-7495`), scrivere un valore su uno slot containment: (1) rifiuta i loop di containment (`:7478-7479`); (2) **stacca** l'oggetto dal suo vecchio contenitore (`:7483-7491`) e (3) ne **ri-punta il `father`** al nuovo slot (`:7492-7494`). L'append di un oggetto nel nuovo contenitore lo rimuove dal vecchio.

Conseguenze per il task:

1. **La Fase 2 non è "aggiungere un guard mancante": è cambiare una POLICY esistente** (auto-move → blocca-e-spiega). L'auto-move è comportamento committato/verificato (§2, §3 di CLAUDE.md): sostituirlo tocca il core del model layer.
2. **L'agente di mappatura ha confermato che OGNI punto di ingresso che aggiunge un oggetto *pre-esistente* a uno slot containment passa per `setValueAtPosition`** (auto-move attivo), oppure è un append **in costruzione** con `father` impostato al momento della creazione (`classes.ts:774-780`) — quindi nessun vecchio contenitore da cui staccare. **Non è stato trovato alcun path che appenda il puntatore di un oggetto esistente a un secondo slot containment saltando `setValueAtPosition`.**
3. **Perciò, a livello di MODELLO, il gesto "aggiungi la stessa Transition a due State" dovrebbe AUTO-SPOSTARLA (containment singolo mantenuto), non condividerla.** Il "containment condiviso" osservato ha quindi due spiegazioni possibili, da dirimere sul codice corrente (§5.1 di CLAUDE.md — non fidarsi di uno stato descritto a memoria):
   - **(b1) artefatto di canvas/sync**: il modello ha auto-spostato la Transition (ora in State2, `father`=State2), ma l'edge composition `State1→Transition` **non è stato rimosso** dal sync/reap → due edge renderizzati → *sembra* condiviso pur non essendolo nel modello. Coerente con la fragilità di sync-edge già vista nella discovery co-evoluzione del 26/07.
   - **(b2) buco reale nell'auto-move**: in uno stato specifico l'auto-move non stacca (es. il `father` della Transition non era mantenuto e risolve al DModel → nessun detach). Da confermare con la probe.

**Prima di progettare il fix va eseguita la probe (§Probe) per stabilire se il containment condiviso esiste davvero nel D-layer o è un artefatto di rendering.** La scelta di dove agganciare il guard dipende da questo esito.

---

## File letti / analizzati (path completi)

- **Model write API + auto-move (core)**: `frontend/src/model/logicWrapper/LModelElement.tsx` — `LValue.setValueAtPosition` pubblico `:7405-7406`, `_clearValueAtPosition` `:7409-7432`, `get_setValueAtPosition` (impl reale + auto-move) `:7433-7532`, `set_values` `:7534-7588`, funnel `.value`/`.values`/`t2m` `:6537-6672`; `LReference.set_containment` (M2) `:4004-4060`; `LReference.containment/composition` flag `:3806-4069`; `get_father`/`set_father` `:707-770`, `:6124`.
- **Costruzione con father-param (append implicito)**: `frontend/src/joiner/classes.ts:774-780` (Constructors: `fatherType==='DModel'`→`objects +=`, altrimenti→`values +=`).
- **Guard esistente (invarianti)**: `frontend/src/model/conformance/ConformanceGuard.ts` (intero: `checkLinkCreation` upper-bound `:17-100`, `checkObjectCreation` `:108`, `checkValueAssignment` `:141`, `emitGuardViolation` `:261-264`); `frontend/src/model/conformance/useConformanceGuard.ts` (intero); `frontend/src/model/conformance/ConformanceTypes.ts` (tipi `GuardResult`, riferito).
- **Feedback**: `frontend/src/components/Toast/ToastContext.tsx:95-118` (listener GUARD_VIOLATION → toast); `frontend/src/events/registry.ts:52` (`GUARD_VIOLATION`).
- **Punti di ingresso (canvas)**: `frontend/src/components/editor-v2/EditorV2.tsx` — `handleM1ReferenceSelected` `:1585-1673`, `performContainmentDrop`/`createCompositionChild` `:2581-2649`, chiamate `guardLink` `:1597,:2584,:2782`; `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — `syncCreateCompositionLink` `:1400-1484`, `syncCreateReferenceLink` `:1491-1552`, `reconcileJjomAfterUndoRedo` `:1576+`.
- **Punti di ingresso (tree/props/script/import)** — verificati via fan-out read-only: `components/editors/Info.tsx:640,648,665,669`; `components/contextMenu/ContextMenu.tsx:331-394`; `jjscript/executor/commands/instance.ts:596,634,702-704`; import `LModelElement.tsx:6961-6970`, `services/export/XMIService.ts:1018,1196,881`, `api/data.ts:214,370,594-598`; `components/project/ProjectEditor.tsx:1717,1929`; JjTL `jjtl/executor/executor.ts`/`jjodelConverter.ts` (nessuna scrittura diretta di slot M1).

---

## Findings per le 7 domande

### Q1 — Punto di scrittura di uno slot di riferimento

**Choke-point unico nel model layer.** Tutte le scritture di valori di uno slot convergono su `LValue.setValueAtPosition` (per-indice) e `LValue.set_values` (bulk):

- `set_values(val0, c)` (`:7534`): normalizza a array, poi cicla `get_setValueAtPosition(c)(i, val[i], …)` per ogni indice (`:7576`), infine fa il trim dell'eccedenza.
- `get_setValueAtPosition(c)` (`:7433`) ritorna la funzione reale (il metodo pubblico `:7405` è uno stub `cannotCall`, l'impl vive nel getter). Qui stanno TUTTI i side-effect (tipo, `instanceof`, containment, `father`, `pointedBy`, e la `SetFieldAction` finale sul valore `:7519`).
- I setter L-proxy `lvalue.values = […]` e `lvalue.value = x` instradano qui (via `_defaultSetter`/`set_values`; il funnel `t2m` a `:6672` idem). Firma effettiva: `set_values(val0: orArr<values>, c): boolean` e `get_setValueAtPosition(c): (index, val, info?, outactions?, lname?) => {success, reason?}`.

**Non ci sono percorsi paralleli "legittimi" di add di un oggetto esistente** che scavalchino questo choke-point (Q4). Esistono append **in costruzione** (father-param, `classes.ts:774-780`) usati alla creazione di nuovi oggetti, che non passano da `setValueAtPosition` ma impostano `father` alla creazione.

### Q2 — Distinzione containment vs non-containment al momento della scrittura

**Sì, nota alla scrittura.** In `get_setValueAtPosition`, `info.isContainment` è derivato da `instanceof` dello slot (`:7458-7459`):
```
info.isContainment = !info.instanceof || (info.instanceof.className === DReference && (info.instanceof as LReference).containment);
```
`instanceof` è la `DReference` M2 dello slot; il flag `containment` (`= composition || aggregation`, `:4003`) è il metadato Ecore. È accessibile esattamente nel punto di scrittura (Q1). Lo stesso vale nel ramo di clear (`_clearValueAtPosition:7420-7427`). Fuori dal model layer, `getCompatibleReferences`/`MetaclassReference.containment` (`useEditorMode.ts:410`) e `metaRef.containment` (`EditorV2.tsx:1611,1621`) espongono lo stesso flag ai punti di ingresso canvas.

### Q3 — Back-pointer al contenitore (eContainer)

**Sì: `DObject.father`.** Per un oggetto **contenuto**, `father` = id della **DValue contenitore** (lo slot), non del DObject padre; per un **root**, `father` = id del **DModel**. Navigabile O(1) via `lObject.father` (`get_father:707`). Prove:
- L'auto-move imposta `SetFieldAction.new(val, "father", c.data.id, …)` dove `c.data` è la DValue slot (`:7493`); il clear lo riporta al model (`_clearValueAtPosition:7429`, `father = model.id`).
- `set_containment` (M2) fa lo stesso in massa: `pointedobj.father = newid` con `newid = val ? dval.id : dmodel.id` (`:4040-4044`).
- Alla costruzione, `father` è passato al Constructor e determina l'append (`classes.ts:774-780`).

Quindi "questo oggetto ha già un contenitore?" si risponde **senza scansione globale**: `lObject.father` e controllo `father.className === 'DValue'` (contenuto) vs `'DModel'` (root). Il "vecchio contenitore" dell'auto-move è ricavato esattamente così (`oldContainer = lvalo.father`, `:7480`).

### Q4 — Punti di ingresso che mutano uno slot containment (mappa autorevole)

Legenda: **CANON** = passa da `setValueAtPosition` (auto-move attivo) · **COSTR** = append in costruzione con father-param (`classes.ts:774-780`, nuovo oggetto, nessun vecchio contenitore) · **N/A** = non tocca slot containment M1.

| Ingresso | file:riga | Path |
|---|---|---|
| Edge authoring M1 (drag composition) | `EditorV2.tsx:1622` → `canvasToJjom.ts:1456-1461` `refProxy.values = […]` | **CANON** |
| Containment drop (palette→container) | `EditorV2.tsx:2607` `syncCreateObject` + `:2624` `syncCreateCompositionLink` | **CANON** (ma crea SEMPRE un nuovo child → non riusa un oggetto esistente) |
| Props/Slots panel — set valore | `Info.tsx:669` `value.setValueAtPosition(i, …)` | **CANON** |
| Props/Slots panel — bottone "add" | `Info.tsx:640` `SetFieldAction 'values' '+='` con `U.initializeValue` | BYPASS **ma innocuo**: appende un placeholder primitivo vuoto (`U.tsx:798-816`), mai un pointer a oggetto |
| Tree/context-menu "add child" (1 sottoclasse) | `ContextMenu.tsx:380` `l.addObject({}, out[0])` | **COSTR** (father=DValue alla creazione) |
| Tree/context-menu "add child" (N sottoclassi) | `ContextMenu.tsx:393-394` `l.addObject` + `l.values = […]` | **CANON** (il secondo write) su **COSTR** |
| JjScript — link reference/containment | `instance.ts:702-704` `refProxy.values = […]` | **CANON** |
| Import (addObject / DObject.new3) | `LModelElement.tsx:6961-6970` (`set_values` SOLO ramo `isReference && !isContainment`) | **COSTR** per il containment |
| Import XMI (containment child) | `XMIService.ts:1018` `DObject.new(child, containmentDValue.id, …)` | **COSTR** (commento `:1019-1024` vieta il push diretto) |
| Import Ecore (parseDObject) | `api/data.ts:594` `DObject.new(…, parent.id)` + `:598` `values.push` + `:595` `father=parent` | **COSTR** (parse-time, father esplicito) |
| Executor→canvas materializzazione | `ProjectEditor.tsx:1717` (father=DModel) + `:1929` `setValueAtPosition` | **CANON** |
| Undo/redo | `canvasToJjom.ts:1576` `reconcileJjomAfterUndoRedo` | **N/A** (solo attributi M2; la ri-creazione link passa da `syncCreateComposition/ReferenceLink` = **CANON**) |
| JjTL executor | `jjtl/executor/*` | **N/A** al model M1 (produce un target via `jjodelConverter`, materializzato a valle) |

**Conclusione Q4**: **un singolo enforcement in `setValueAtPosition` coprirebbe TUTTI i path di add di un oggetto esistente** (nessun bypass reale trovato). I path **COSTR** creano nuovi oggetti con father impostato → non producono la condizione "secondo contenitore su oggetto esistente". Grep globale dei write diretti a `values` che scavalcano il setter: solo placeholder/attributi/remap-import/rimozioni (`Info.tsx:640`, `LModelElement.tsx:4034,6115`, `XMIService.ts:881,1196`, `api/data.ts:214,370,598`) — **nessuno è un add di oggetto in containment che sfugga all'auto-move**.

### Q5 — Riproduzione del bug

**Gesto**: nel diagramma M1, trascinare un edge `ownedTransitions` (containment) da uno State a una **Transition già contenuta** in un altro State. Catena:
`onConnectEnd` (`EditorV2.tsx:1337`) → `getCompatibleReferences` → `handleM1ReferenceSelected` (`:1585`) → `guardLink(sourceObjectId, metaRef.name)` (`:1597`, controlla SOLO l'upper-bound → per `ownedTransitions` `0..*` passa) → `metaRef.containment` true → `syncCreateCompositionLink(edgeSource, edgeTarget, 'ownedTransitions')` (`:1622` → `canvasToJjom.ts:1456`) → `refProxy.values = [...meaningful, childId]` → `set_values` → `setValueAtPosition` → **auto-move (detach da State1, father→State2)**.

**Tensione (§SINTESI)**: questo path attiva l'auto-move, che a livello di modello **sposta** la Transition (non la condivide). Quindi, salvo un buco dell'auto-move (b2), lo stato "due State contengono la stessa Transition" nel D-layer non dovrebbe formarsi da questo gesto. La probe (sotto) stabilisce se il containment condiviso è reale (b2) o un artefatto di edge stale sul canvas (b1). L'`EdgeAuthoringPanel` recente NON scrive slot del modello (è authoring IR della vista), quindi non è coinvolto nella mutazione.

### Q6 — Canale di feedback per "blocca e spiega"

**Già cablato e riusabile 1:1.** Le funzioni pure `check*` (`ConformanceGuard.ts`) ritornano `GuardResult` (`{allowed, violationType, message, details}`); `emitGuardViolation(result)` (`:261-264`) dispatcha `JjodelEvents.GUARD_VIOLATION` (`registry.ts:52` = `'jjodel:guard-violation'`); `ToastContext.tsx:105-118` ascolta (gated su `prefs.enableGuardViolations`) e mostra un **toast `warning` a dismiss manuale** con `title:'Guard Violation'` e `detail.message`. Il precedente esatto è l'upper-bound: `guardLink` → `checkLinkCreation` → `emitGuardViolation` → toast. Un guard single-container riuserebbe questo canale (nuovo `violationType`, nuovo messaggio). Altri feedback simili: `toast.error` diretto in `set_name` (`classes.ts:2153`), pattern CustomEvent+useState di `ImportSummaryModal` (§8.7 CLAUDE.md). Icone: Bootstrap Icons (vincolo rispettato dal toast esistente).

### Q7 — Famiglia di invarianti esistente

Esiste una famiglia, ma **nessun** enforcement single-container esplicito by-design:
- **Upper-bound** (molteplicità): `ConformanceGuard.checkLinkCreation` (`:17-100`) via `guardLink`, chiamato ai gesti canvas (`EditorV2.tsx:1597,2584,2782`). Ritorna `multiplicity_upper_exceeded`. **Non** controlla il containment.
- **Type/class**: `checkValueAssignment` (`:141`, type mismatch attributi), `checkObjectCreation` (`:108`, classe nel metamodello).
- **Containment loop**: rifiuto a `setValueAtPosition:7478-7479` (`"cannot create a containment loop"`, se il target è nella `fatherList`) e warning a M2 in `set_type`/`set_containment` (`:1461`, `:4007-4009`).
- **"Contained twice"** a M2: quando si attiva `composition` su una reference, `set_containment` rimuove i duplicati **nella stessa collezione** (`:4031-4036`) e ri-mappa i `father` (`:4038-4046`). È il parente più stretto del single-container, ma opera solo all'attivazione del flag a M2, non alla scrittura M1 cross-contenitore.
- **Single-container a runtime**: implementato **solo** come **auto-move** in `setValueAtPosition` (`:7477-7495`), non come blocco. `checkLinkCreation` conteggia già le feature per `ref.id` (`:50-68`): estenderlo per "il target ha già un contenitore" è a basso costo.

**Nota igiene**: `ConformanceGuard.ts` contiene ancora instrumentazione **`[BUG-DIAG-GUARD]`** non committata (`:47-48,:57-78`, `console.log`). Da rimuovere in un commit di cleanup dedicato (§2 CLAUDE.md), fuori da questo task.

---

## Probe (da eseguire dopo il gesto — stabilisce b1 vs b2, §5.1)

Riprodurre il gesto (trascinare `ownedTransitions` da State2 a una Transition già in State1), poi in DevTools (`windoww.store`, doppia w). Non muta nulla. Distingue **containment condiviso reale** (Transition nei raw `values` di ENTRAMBI gli slot) da **artefatto canvas** (auto-mossa: solo in State2, `father`=State2, ma due edge a schermo).

```js
(() => {
  const S1 = 'State1', S2 = 'State2', REF = 'ownedTransitions'; // adatta i nomi
  const L = windoww.store.getState().idlookup;
  const objs = Object.values(L).filter(e => e && e.className === 'DObject');
  const byName = n => objs.find(o => o.name === n);
  const s1 = byName(S1), s2 = byName(S2);
  const slotOf = (dObj) => (dObj?.features ?? [])
    .map(fid => ({ dval: L[fid], meta: L[L[fid]?.instanceof] }))
    .find(x => x.meta?.className === 'DReference' && x.meta?.name === REF);
  const slot1 = slotOf(s1), slot2 = slotOf(s2);
  const v1 = slot1?.dval?.values ?? [], v2 = slot2?.dval?.values ?? [];
  console.log('[probe] State1.ownedTransitions.values (raw)', { slotId: slot1?.dval?.id, values: v1 });
  console.log('[probe] State2.ownedTransitions.values (raw)', { slotId: slot2?.dval?.id, values: v2 });
  // la/le Transition che compaiono in entrambi gli slot = containment CONDIVISO reale (b2)
  const shared = v1.filter(x => v2.includes(x));
  console.log('[probe] shared in both slots:', shared);
  // per ciascuna Transition condivisa, chi è il father? (= quale DValue la contiene davvero)
  shared.forEach(tid => {
    const t = L[tid];
    console.log('[probe] Transition', tid, 'father =', t?.father,
      '=> punta a', L[t?.father]?.className, L[t?.father]?.id,
      '| slot1?', t?.father === slot1?.dval?.id, '| slot2?', t?.father === slot2?.dval?.id);
  });
  console.log(shared.length
    ? '=> b2: containment CONDIVISO reale nel D-layer (la stessa Transition in due slot values). father indica quale è "vero".'
    : '=> b1: NESSUN condiviso nel modello (auto-move ha spostato). Se vedi 2 edge, è artefatto di canvas/sync.');
})();
```

Interpretazione: se `shared.length > 0` → **b2** (buco reale nell'auto-move: la Transition è in entrambi gli slot `values`; il `father` indica quale contenitore l'auto-move ha impostato, l'altro slot è "orfano non ripulito"). Se `shared.length === 0` → **b1** (il modello è coerente, il problema è di rendering/reap degli edge, come nella co-evoluzione del 26/07). Il fix di Fase 2 va progettato sull'esito.

---

## Opzioni di aggancio del guard (ricognizione, NON decisione)

Da progettare in chat dopo la probe. La decisione "blocca e spiega, no auto-move" è un **cambio di policy** rispetto all'auto-move esistente.

- **Opzione A — model write path (`setValueAtPosition`, `:7477-7495`)**: sostituire il ramo auto-move con un rifiuto (`return {success:false, reason:'target already contained elsewhere'}`) quando `oldContainerValue && oldContainerValue.id !== c.data.id`, + emissione della violazione. **Pro**: choke-point unico → copre TUTTI i path (canvas/tree/JjScript/import materializzato) con una sola modifica; usa il `father` già disponibile (O(1)). **Contro**: tocca il **core** del model layer (§5 CLAUDE.md → approvazione), cambia comportamento **committato/verificato** (l'auto-move); rischio regressione su chi oggi *si aspetta* l'auto-move (verificare i consumer: `set_containment` a M2 riusa lo stesso path in massa; import materializzato). Va deciso se il rifiuto è globale o gated (solo interazione utente vs anche import/transform).
- **Opzione B — guard layer + entry point canvas (`ConformanceGuard` + `handleM1ReferenceSelected`/`performContainmentDrop`)**: nuovo `checkContainerAssignment(targetObjectId)` che verifica `target.father?.className === 'DValue' && father !== slotCorrente` e ritorna `GuardResult`; chiamato accanto a `guardLink` prima di `syncCreateCompositionLink`. **Pro**: fuori dal core, riusa `emitGuardViolation`→toast, nessun cambio all'auto-move committato. **Contro**: copre **solo** i gesti canvas; JjScript (`instance.ts:704`) e altri path CANON continuerebbero ad auto-muovere (policy incoerente tra path). Va deciso se accettabile in v1.
- **Ibrido**: A per la correttezza universale (rifiuto nel model layer) + B/`GuardResult` per il messaggio ricco all'utente sui gesti canvas.

In tutti i casi: **niente auto-move** (rimuovere/gateare `:7483-7494`), l'elemento resta al contenitore attuale, il toast spiega.

---

## Dipendenze e rischi

1. **La probe è prerequisita** (§5.1): senza confermare b1 vs b2 sul codice corrente, il fix rischia di curare il sintomo sbagliato (un guard "blocca" che non serve se il modello già auto-sposta e il difetto è di rendering).
2. **Cambio di comportamento committato** (l'auto-move): Opzione A degrada una funzionalità verificata; serve censire chi dipende dall'auto-move (`set_containment` M2 in massa `:4022-4046`, materializzazione executor `ProjectEditor.tsx:1929`, import) prima di trasformarlo in rifiuto — altrimenti si rompono move legittimi.
3. **Coerenza cross-path**: Opzione B lascia JjScript/altri CANON ad auto-muovere → policy incoerente. Decidere il perimetro di v1.
4. **`guardLink` è già chiamato ma inefficace per il containment** (`EditorV2.tsx:1597`): l'upper-bound `0..*` passa; il guard corrente NON vede il single-container. Estendere `checkLinkCreation` o aggiungere un check dedicato.
5. **Instrumentazione `[BUG-DIAG-GUARD]`** non committata in `ConformanceGuard.ts`: da rimuovere in cleanup separato, non in questo filone.
6. **Fragilità edge-sync nota** (co-evoluzione 26/07): se l'esito è b1, il filone corretto è il reap/sync dell'edge composition orfano dopo l'auto-move, non un guard di containment — path diverso.

---

## Domande aperte per Alfonso

- **OQ-1 (prerequisito)**: esegui la probe e riporta `shared.length` e i `father` — è containment **condiviso reale** (b2) o **artefatto di canvas** (b1)? Il resto del design dipende da qui.
- **OQ-2 (policy vs auto-move)**: confermi che l'obiettivo è **rimuovere** l'auto-move esistente (`:7483-7494`) in favore del blocco? O il blocco deve valere solo per l'interazione utente, lasciando l'auto-move per import/transform/materializzazione?
- **OQ-3 (perimetro)**: v1 copre solo i gesti canvas (Opzione B, più sicura, ma incoerente con JjScript) o tutti i path (Opzione A, core, richiede approvazione §5)?
- **OQ-4 (aggancio)**: Opzione A (model layer, choke-point unico) vs B (guard layer, solo canvas) vs ibrido? Se A, va gated per non rompere `set_containment`/import?
- **OQ-5 (messaggio)**: testo del toast "blocca e spiega" (es. "«Transition X» è già contenuta in «State1» via ownedTransitions; un elemento containment ha un solo contenitore. Rimuovila prima da State1."). Confermi rame/dismiss manuale come l'upper-bound?
- **OQ-6 (self-loop / stesso contenitore)**: ri-aggiungere la Transition allo **stesso** slot che già la contiene deve essere no-op silenzioso (oggi `setValueAtPosition:7440` ritorna `"identical assignment"`), corretto?

---

## Riferimenti

- Auto-move / single-container esistente: `LModelElement.tsx:7477-7495` (detach+father), `:7409-7432` (clear→father=model), `:7478-7479` (loop), `:4004-4060` (set_containment M2).
- API di scrittura: `LModelElement.tsx:7433-7532,7534-7588`; funnel `:6537-6672`; costruzione `joiner/classes.ts:774-780`.
- Guard/feedback: `ConformanceGuard.ts:17-100,261-264`, `useConformanceGuard.ts:27`, `ToastContext.tsx:105-118`, `events/registry.ts:52`.
- Gesto/repro: `EditorV2.tsx:1585-1673,2581-2649`, `canvasToJjom.ts:1400-1484`.
- Prior art classe di bug (fragilità edge-sync): `docs/discovery/discovery_2026-07-26_coevolution_edge_rename.md`.
