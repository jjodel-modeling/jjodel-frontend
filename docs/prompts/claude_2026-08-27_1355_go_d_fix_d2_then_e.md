# GO Claude Code: esito visivo del commit D, fix D2, poi commit E

> **Nome del documento prompt**: 2026-08-27 13:55

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili.
Corsia: veloce per D2 (tre file, fix puntuali); E resta nella corsia del prompt padre.
**Corregge**: 2026-08-27 12:40 (Slice 1b, commit D `816b34e9d`), causa (c): la fixture ha
esercitato percorsi che nessun modello del corpus esercitava.

Verifica visiva di D fatta dalla chat sul Chrome di Alfonso (fixture importata in un progetto
nuovo, `Form 1b fixture`, salvato dopo l'import). Esito: **V3 e V4 verdi, V1 e V2 verdi con tre
finding**, di cui uno nel core. Nessun rework sul disegno di D: il registry, la distribuzione per
campo, il riepilogo, la precedenza dirty/diagnostica e il reset dopo il save funzionano come
scritto. Il check che intercetta `Broken.kind` è `missing_required_attr` (messaggio `Object
"Broken" is missing required attribute "kind"`); annotalo nel log.

## Cosa si è visto

- V1: import ecore e xmi puliti (3 classi, 11 attributi, 6 riferimenti, 1 enum; 1 root, 9 nested).
  `isHistory` checkbox spuntata, `timeout` stepper a 30, `depth` read-only con lucchetto e
  `derived`, `tags` due righe. Scrittura di number e checkbox confermata dallo store
  (`timeout` 45, `isHistory` false). **`kind` select vuota** (F1).
- V2: `1 error`, bordo rosso e messaggio nello slot 16px, riepilogo 32px. Scegliere `normal`
  toglie l'errore, `getBoundingClientRect` dei nove campi identico prima e dopo (zero shift).
  Compare però un **warning** `invalid_enum_literal` sul valore appena scritto (F4, pre-esistente).
- V3: click sulla chip `1 error` → focus sulla `select` di `kind`.
- V4: punto cyan con alone, bordo `#7dd3fc`, `Modified, not saved` in `#0284c7`; dopo
  `SaveManager.save()` i marker restano fino al primo re-render, poi spariscono (2 → 0).

## Finding

**F1, form.** La `select` dell'enum resta vuota quando il valore grezzo è il **nome** del literal
(`__raw.values = ["normal"]`, come scrive l'importer XMI), perché le opzioni sono chiavizzate per
id (`validTargetOptions`). Il getter L `.values` risolve il nome nel pointer; `rawValues` no.
Fix in `describeSlot` (`useFormWidgets.ts`): per gli enum, normalizza ogni valore che non è un id
di opzione cercando l'opzione con `label === valore`; il descrittore espone sempre id. La
scrittura resta per id (`setSlotValue(..., true)`), come fa `Info.tsx`.

**F2, form.** Righe di riferimenti e children mostrano `State_0` / `Transition_0`:
`IRFormField.displayValue` legge `idlookup[id].name`, cioè il nome D, che l'importer XMI non
allinea allo slot `name` (pre-esistente, va a backlog). L'header della form usa `lObject.name` e
mostra `Running`. Fix: `displayValue` risolve con `LPointerTargetable.fromPointer(id).name`
(stessa lettura dell'header, CLAUDE.md 3.12); vale anche per `ReferenceWidget` e `ListWidget` di E,
che devono nascere già con questa risoluzione.

**F3, core.** `transientProperties.modelElement` è **vuoto** (0 chiavi; il reducer ha la riga di
popolamento commentata, `reducer.ts:1093`), quindi `LValue.get_values` (`LModelElement.tsx:7313`)
e `set_values` (`:7714`) fanno `td.derived_read` su `undefined` per **ogni feature `derived`**:
`Info.tsx` crolla (`Cannot read properties of undefined (reading 'derived_read')`, 206+ errori,
il boundary smonta il rail). È il todo 2 del checkpoint 1a, ora con la root cause. Provato a
runtime: con `transientProperties.modelElement[depth.id] = {}` il pannello classico rende `Broken`
senza errori. La form non ne soffre perché legge `__raw.values`. Fix, due righe uguali nei due
siti, stesso idioma di `ocl.tsx:80-81`:
`let td = transientProperties.modelElement[dmeta.id] || (transientProperties.modelElement[dmeta.id] = new DataTransientProperties());`
`LModelElement.tsx` non è nella critical zone §3.1; è core, e la modifica è un guard senza cambio
di comportamento sui percorsi che oggi funzionano. `DataTransientProperties` è già importata in
quel file (`LModelElement.tsx:9`).

**F4, pre-esistente, a backlog, non toccare.** Gli editor scrivono gli enum per **id** del literal
(`Info.tsx`, opzioni `value: object.id`; verificato: anche il pannello classico produce lo stesso
warning), mentre `ConformanceValidator` CHECK 10 (`:302-322`) e l'importer XMI ragionano per
**nome**. Ogni modifica di un enum da qualunque pannello genera un `invalid_enum_literal` spurio.
Va in `docs/TECH-DEBT.md` con una riga, e la decisione sul canone (id o nome) è di Alfonso.

**F5, processo.** I "blocchi del renderer" (D4 del checkpoint 1a, e cinque oggi) erano la scheda
Chrome in background: `document.hidden === true`, timer strozzati, `requestAnimationFrame` fermo,
screenshot in timeout. Nessun long task sopra 264 ms in tutta la sessione. Regola per P8: la
scheda pilotata deve essere visibile a schermo, e la sonda controlla `document.visibilityState`
prima di misurare. Inoltre l'import non persiste finché non si salva: la procedura di V1 include
`SaveManager.save()` subito dopo il secondo import.

## COSA: commit D2

`fix(rail+core): enum display by literal name, L-name in value rows, guard for derived slots (form views 1b)`

| File | Cosa |
|---|---|
| `viewpoint/ir/useFormWidgets.ts` | F1: normalizzazione nome → id per gli enum in `describeSlot`. Test: uno slot enum con `__raw.values = ['normal']` e opzioni per id produce `values = [id]`; un id resta id; un nome sconosciuto resta com'è (la diagnostica lo dirà). |
| `viewpoint/ir/IRFormField.tsx` | F2: `displayValue` via `LPointerTargetable.fromPointer`. Il commento della funzione va riscritto: la ragione "read straight from idlookup" non regge più. |
| `model/logicWrapper/LModelElement.tsx` | F3: il guard nei due siti, con un commento di una riga che cita `reducer.ts:1093`. Nessun altro tocco. Test: se esiste una suite su `LValue` in ambiente node, un caso con `derived: true`; se non esiste, non crearla, e la prova è quella visiva. |
| `docs/TECH-DEBT.md` | F4 (una voce) e il disallineamento `DObject.name` / slot `name` nell'importer XMI (una voce). |

Gate come nel prompt padre. Hard stop dopo D2: la chat ripete V1 su `kind`, `outgoing`,
`substates` e il pannello classico su `Broken`. Poi, **su GO della chat, il commit E** come da
prompt del 12:40, con la micro-discovery del punto 10 riportata in chat prima del diff su
`formWrite.ts`, e con F2 già applicata a `ReferenceWidget` e `ListWidget`.

## NON FARE

Non toccare `ConformanceValidator.ts`, `XMIService.ts`, `Info.tsx`, `reducer.ts`. Non
"correggere" F4 di lato cambiando cosa scrive la form: scriverebbe diversamente da `Info.tsx`.
