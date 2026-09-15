# Prompt Claude Code: la rinomina IR di un oggetto con slot diventa un solo dispatch (R-UNDO-5)

**Two-phase. Fase 1: discovery read-only, report obbligatorio in `docs/discovery/`, hard stop.
Fase 2 solo dopo GO in chat: un file, corsia veloce.** Effort xhigh per la Fase 1, high per la
Fase 2. Leggere a inizio sessione: `CLAUDE.md` (§3.12 e §3.13), `docs/decisions.md` (serie
R-UNDO, nuova, in particolare R-UNDO-5), gli addendum §8 e §9 di
`docs/discovery/discovery_2026-08-24_undo_reducer_rename.md`,
`docs/discovery/2026-06-19_slot_write_failure.md` (Direction A), e `docs/claude-code-log.md`.
Conflitti con CLAUDE.md o col registro: segnalare e fermarsi.

## COSA

Misurato il 2026-08-25 (addendum §9): rinominare un oggetto con slot identità popolato
dall'editor inline IR produce **due dispatch** a 100-300 ms di distanza. `syncNodeLabel`
(`frontend/src/components/editor-v2/sync/canvasToJjom.ts:605-616`) assegna `model.name`, cioè
`LObject.set_name` (`frontend/src/model/logicWrapper/LModelElement.tsx:6145`), che scrive
`DObject.name` in una `TRANSACTION` (`:6162-6164`) e poi, con `AFTER_UPDATE` (`:6174-6197`, la
Direction A del 2026-06-19), scrive lo slot con `slot.value = newName` (`:6188`), cioè
`setValueAtPosition` (`:7515`), la cui `TRANSACTION` (`:7595`) scrive `values.0` **e** rispecchia
`name` sul padre (`:7602-7603`). Il secondo dispatch cade nei 450 ms di coalescenza del reducer e
`U.objectMergeInPlace` (superficiale, first-wins sulla chiave `idlookup`) perde il vecchio valore
dello slot. ⌘Z riporta solo `DObject.name`; tree, pannello proprietà e canvas leggono lo slot e non
cambiano. La controprova è nel §9: scrivere il **solo slot** da console produce un dispatch e un
delta con `values.0` e `name`, e ⌘Z riporta tutto, canvas IR compreso.

Chiusura ratificata (R-UNDO-5): `syncNodeLabel` scrive lo slot quando l'oggetto ha uno slot
identità popolato, e `name` solo altrimenti. Un file. Il reducer, `set_name`, `setValueAtPosition`
e la Direction A **non si toccano**.

## FASE 1: discovery read-only

Obiettivo: confermare che la scrittura dello slot da `syncNodeLabel` è sufficiente e sicura, e
misurare cosa si perde rispetto al percorso `set_name`. Nessuna modifica al codice. Rispondere,
con path e righe:

1. **Chiamanti.** Chi chiama `syncNodeLabel` (grep su `src`)? Per ogni chiamante: il `model` è
   sempre un `LObject`, o può essere un `LClass`, un `LEnumerator`, un `LPackage` (metamodello,
   sintassi astratta)? La rinomina di `Final → Fine` del §9 passa da `mm-node__input`: stesso
   `syncNodeLabel` o un'altra via?
2. **Slot identità.** Come si legge lo slot identità di un `LObject`: `lobj.instanceof?.identityAttribute`
   (`LModelElement.tsx:3067-3077`) e `lobj['$' + name]`, come fa `set_name` a `:6174-6197`. Cosa
   restituisce `identityAttribute` quando la classe non ha attributi (caso «test layout» del §8),
   quando l'attributo identità non si chiama `name`, quando lo slot esiste ma è vuoto
   (`values: []`, `isMirage`), quando l'oggetto è shapeless. Per ciascun caso: si scrive lo slot o
   `name`?
3. **Unicità.** `validateNameUniqueness` (`frontend/src/model/logicWrapper/nameUniqueness.ts:79`)
   oggi gira in `set_name` (`:6149-6160`) e con collisione mostra un toast e non scrive. Il percorso
   `setValueAtPosition` la esegue? Se no, `syncNodeLabel` la deve chiamare prima di scrivere lo slot,
   con la stessa semantica (toast, nessuna scrittura). Verificare la firma e cosa serve passarle.
4. **Il rispecchiamento** `values.0 → name` in `setValueAtPosition` (`:7602-7603`): condizione
   esatta (`index === 0 && lname === 'name' && c.data.father`). Se l'attributo identità non si
   chiama `name`, `DObject.name` non viene rispecchiato: in quel caso `syncNodeLabel` deve scrivere
   anche `name`? E questo riaprirebbe i due dispatch? Proporre la regola, non deciderla.
5. **Il valore uguale.** `set_name` ha la guardia `c.data.name === val` (`:6147`) e il callback ha
   `cur !== newName` (`:6188`). `setValueAtPosition` con lo stesso valore produce un dispatch vuoto
   o nessun dispatch? Serve una guardia in `syncNodeLabel`?
6. **Test esistenti** su `canvasToJjom.ts` e sull'undo (`vitest`, grep `syncNodeLabel`,
   `userHasInteracted`, `objectMergeInPlace`): cosa coprono, cosa andrebbe aggiunto (un test puro
   sul numero di dispatch è possibile senza il DOM?).

**Report obbligatorio**: `docs/discovery/discovery_2026-08-25_rename_single_dispatch.md`, con
obiettivo, file letti (path completi), findings per ciascuno dei sei punti, dipendenze e rischi,
domande aperte per Alfonso, e una **bozza del diff** di `syncNodeLabel` (non applicata). Commit
del solo report: `docs: discovery on the single-dispatch rename of a slotted object`. Entry nel
log. **Hard stop**: l'analisi si fa in chat sul report salvato.

## FASE 2 (solo dopo GO in chat)

`frontend/src/components/editor-v2/sync/canvasToJjom.ts`, `syncNodeLabel`, nella forma decisa
al GO. Traccia attesa, da adattare ai findings:

```ts
export function syncNodeLabel(vertexId: string, newName: string): void {
    try {
        const vertexProxy: any = LPointerTargetable.fromPointer(vertexId);
        const model = vertexProxy?.model;
        if (!model) return;
        const identityAttr = model.instanceof?.identityAttribute;           // LObject only
        const slot = identityAttr ? model['$' + identityAttr.name] : undefined;
        const cur = slot?.__raw?.values?.[0];
        const hasPopulatedSlot = !!slot && slot.className === 'DValue'
            && cur !== undefined && cur !== null && cur !== '';
        if (hasPopulatedSlot) {
            if (cur === newName) return;
            // uniqueness check here, same outcome as set_name (toast, no write)
            slot.value = newName;   // one dispatch: values.0 + name mirror (R-UNDO-5)
        } else {
            model.name = newName;   // no slot: set_name, as today
        }
    } catch (err) {
        console.warn('[canvasToJjom] Failed to sync node label:', err);
    }
}
```

Commento di tre righe sopra il ramo: perché lo slot (R-UNDO-5, addendum §9), perché `name` solo
senza slot, e che `set_name` e la Direction A non si toccano. Nessun'altra riga del file cambia.
Nessun nuovo identificatore esportato senza `grep` preventivo.

Gate: `tsc` 33 con lo stesso insieme di errori, vitest 1349 passed con le stesse 9 suite rosse
(più i test eventualmente aggiunti al GO), build exit 0. Commit
`fix(editor-v2): rename of a slotted object as a single dispatch (R-UNDO-5)`, `git add` del solo
file (più il test se deciso). Entry nel log con `Corregge: 2026-08-25 00:30`, `Causa: (c)`.

## Verifica visiva (Alfonso, hard refresh, porta 3000, progetto «State Machine v1»)

1. `model_1` conforme a `Class Diagram`, viewpoint `Class Diagram v1`: rinomina `Person →
   Persona` dall'editor inline, Invio, un ⌘Z: `Person` su tree, pannello **e canvas**; ⌘⇧Z:
   `Persona` ovunque. Status bar allineata alle tre superfici.
2. Stessa rinomina verso un nome già usato nello stesso scope: toast, nessuna scrittura, nessun
   passo di undo nuovo.
3. Metamodello `State Machine`, sintassi astratta: rinomina `Final → Fine`, un ⌘Z: tree e
   pannello tornano a `Final` (il canvas resta fermo: fronte IR, R-UNDO-6).
4. Progetto «test layout» (classe senza attributi, nessuno slot): rinomina dell'oggetto, un ⌘Z:
   tree e pannello tornano indietro come nell'addendum §8.
5. Riallineamento: l'oggetto `Role`/`Ruolo` di «State Machine v1» ha `DObject.name` e slot
   divergenti (residuo del 2026-08-24); rinominarlo una volta dall'editor inline deve riallinearli.

## RIFERIMENTI

- `docs/decisions.md`: R-UNDO-1..6 (2026-08-25), in particolare R-UNDO-5.
- `docs/discovery/discovery_2026-08-24_undo_reducer_rename.md`: §2.3 (fusione), §8 (misura
  senza slot), §9 (misura con slot, controprova del solo slot).
- `docs/discovery/2026-06-19_slot_write_failure.md`: perché la scrittura dello slot non può
  stare nella transazione di `set_name` (Direction A).
- `frontend/src/model/logicWrapper/LModelElement.tsx`: `set_name` `:6145-6199`,
  `get_setValueAtPosition` `:7515-7612`, `identityAttribute` `:3067-3077`.
- `frontend/src/redux/reducer/reducer.ts:1277` (`isRelevantChangeCheck`), `U.objectMergeInPlace`.
