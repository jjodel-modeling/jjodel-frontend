# Discovery — write-path del toggle isID (Properties panel): RCA

**Data**: 2026-07-15
**Tipo**: BLOCCO 1 Fase 0 — RCA read-only del write-path del toggle `iD`. Precede il fix.
**Branch**: `alfonso-frontend-jjtl`
**Fatto accertato (input)**: dopo attivazione del toggle `iD`, **nessun `DAttribute`** nello store ha `isID === true` (verificato a D-layer via `windoww.store`). Il toggle non persiste. Il discriminante manuale su `lowerBound` (CHECK 2) è fallito anch'esso → sospetto di bug **generico al pannello**.

---

## Obiettivo

Individuare il punto esatto in cui la scrittura si perde e l'ampiezza del bug (solo `isID` o generico), con `file:line`. Nessun edit in questa fase.

---

## File letti

- `frontend/src/components/editors/Info.tsx` (`PropertiesToggle :78-102`, `PropertiesNumberInput :151-161`, `Info.attribute :476-485`, resolver `data` `:1403-1406`, routing new-design `:1220-1245`)
- `frontend/src/components/ui/Toggle/Toggle.tsx` (contratto `onChange`)
- `frontend/src/components/editors/views/data/InfoData.tsx` (pannello new-design — solo view)
- `frontend/src/joiner/proxy.ts` (`TargetableProxyHandler` costruttore `:241-253`, `set` trap `:451-504`)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (`set_isID :4312-4319`, `set_lowerBound :1504-1513`, `set___readonly :6487-6497`)
- `frontend/src/common/U.tsx` (`fromBoolString :1679-1690`)
- `frontend/src/joiner/classes.ts` (`__readonly` writers `:2016-2038`)

---

## Il write-path completo (tracciato)

1. `PropertiesToggle` (`Info.tsx:78`): `onChange={handleChange}`, `handleChange = (checked) => (data as any)[field] = checked` (`:82-84`). `field = 'isID'` (`:480`). Il valore proviene da `Toggle`, il cui `onChange` è tipizzato `(checked: boolean) => void` (`Toggle.tsx:20`) ed emette un **booleano** (`Toggle.tsx:78`). → assegnazione `data.isID = true`.
2. `data` = `LModelElement.fromPointer(dataID)` (`Info.tsx:1406`, `dataID = sel.modelElement`), cioè una **L-proxy viva** dell'elemento selezionato (il `DAttribute`).
3. Assegnazione proxy → `TargetableProxyHandler.set` (`proxy.ts:451`). La logic-class è risolta dal **className del D-object**: `RuntimeAccessibleClass.get(d.className)?.logic?.singleton` (`proxy.ts:245`) → per un `DAttribute`, `this.lg = LAttribute` singleton.
4. `set` trap: entra nel branch `propKey in this.l || propKey in this.d || this.l['set_isID']` (`proxy.ts:474`), poi `'set_isID' in this.lg` (`:476`) → **vero** → chiama `this.lg['set_isID'](true, logicContext)` (`:478`).
5. `LAttribute.set_isID` (`LModelElement.tsx:4312`): `val = U.fromBoolString(true)` → **`true`** (`U.tsx:1681`); guardia `if (!!c.data.isID === val) return true` → `false === true` → prosegue; `TRANSACTION(... , () => SetFieldAction.new(c.data, 'isID', true), ...)`.

**Verdetto sul path statico: CORRETTO end-to-end.** È strutturalmente identico ai setter che funzionano (es. `set_abstract :3137`).

---

## Ipotesi scartate (ognuna con motivo)

| Ipotesi | Esito | Evidenza |
|---|---|---|
| Checkbox non collegato | ❌ scartata | `Toggle onChange={handleChange}` → `data[field]=checked` (`Info.tsx:83`, `Toggle.tsx:78`) |
| `onChange` passa non-booleano → `fromBoolString`→false→no-op | ❌ scartata | `Toggle.onChange: (checked:boolean)` (`Toggle.tsx:20`); comunque `fromBoolString(true)=true` (`U.tsx:1681`) |
| Proxy target sbagliato (logic-class base senza `set_isID`) | ❌ scartata | logic-class risolta da `d.className` (`proxy.ts:245`) → `LAttribute`, `set_isID` presente |
| Pannello new-design (`InfoData`) con handler diverso | ❌ scartata | `InfoData.tsx` gestisce solo view (`isExclusiveView/isEdge`); l'attributo passa da `Info.attribute`/`PropertiesToggle` |
| Handler generico che non mappa `isID` | ❌ scartata | il `set` trap mappa dinamicamente `set_` + propKey (`proxy.ts:476-478`) |
| Action mai dispatchata (setter no-op statico) | ❌ scartata | `set_isID` dispatcha `SetFieldAction` in `TRANSACTION` (`LModelElement.tsx:4315-4317`) |

---

## Dove può perdersi la scrittura: due punti a fallimento INVISIBILE

Poiché il path statico è corretto ma a runtime non persiste, il break è a runtime, in **uno dei due soli punti del path che no-oppano silenziosamente restituendo `true`**:

1. **Readonly guard** — `proxy.ts:459-465`:
   ```ts
   if ((this.d as GObject).__readonly && propKey !== '__readonly') { if (ABORT()){...} return true; }
   ```
   Se il `DAttribute` (o il metamodello, via cascata `classes.ts:2036-2037`) ha `__readonly === true`, **ogni** write ritorna `true` senza persistere. → sarebbe **generico al pannello** (isID, lowerBound, tutti i flag) e **senza errore** — coerente con i sintomi. `__readonly` è settato **solo** da azione esplicita `set_readOnly` (`classes.ts:2034`, `LModelElement.tsx:6487`), non in automatico; da confermare a runtime se è settato e perché.

2. **Swallow-on-throw** — `proxy.ts:479-481`:
   ```ts
   try { this.lg[this.s + propKey](value, logicContext); }
   catch (e) { Log.eDevv('failed to set property', {targetObj, propKey, e}); }
   return true;
   ```
   Se `set_isID` (o `TRANSACTION`/`SetFieldAction`/`get_name`) lancia, l'errore è **inghiottito** con un log dev (spesso silenziato) e il trap ritorna comunque `true`. La UI non vede nulla. Questo sarebbe più probabilmente **specifico** (dipende da cosa lancia in quel contesto) che generico.

---

## Ampiezza del bug

**Indeterminata staticamente**, ma il write-path è **condiviso** da tutti i campi M2 del pannello (`PropertiesToggle` per i flag: `abstract`, `interface`, `composition`, `isID`, …; `PropertiesNumberInput` per `lowerBound`/`upperBound`/`ordinal`). Quindi:
- se il break è il **readonly guard** (punto 1) → **generico**: ogni edit M2 su quell'elemento/metamodello no-oppa (coerente con isID **e** lowerBound falliti);
- se è lo **swallow** su un throw specifico (punto 2) → potenzialmente **più stretto**.
Il fatto che **anche** `lowerBound` fallisca spinge verso il **punto 1 (readonly)** o comunque verso una causa comune al pannello, non verso un bug isolato di `isID`.

---

## Sonda per pinnare il break (read-only, DevTools)

```js
const S = windoww.store.getState().idlookup;
const attr = Object.values(S).find(d => d && d.className === 'DAttribute' && d.name === 'code'); // o un altro
console.log('D __readonly:', attr.__readonly, '| father __readonly:',
            S[attr.father] && S[attr.father].__readonly, '| D isID:', attr.isID);
const la = windoww.LPointerTargetable.fromPointer(attr.id);
la.isID = true;                                   // tentativo di write
console.log('DOPO → D isID:', windoww.store.getState().idlookup[attr.id].isID, '| L isID:', la.isID);
```
Lettura:
- **`__readonly` truthy** (su attr o father) → causa = **readonly guard** (`proxy.ts:459`). Fix a monte: capire perché il metamodello/attributo è readonly (stato di edit? flag ereditato?).
- **`__readonly` falsy** e D isID resta `false` → il setter **lancia** ed è inghiottito (`proxy.ts:480`). Per vederlo serve rendere visibile lo swallow (una riga temporanea `console.error` al posto/oltre `Log.eDevv` a `proxy.ts:480`) — **richiede OK** (proxy.ts è critical zone).

---

## Gate → STOP AND ASK

Il path statico è corretto; il break è **runtime**, in uno dei due punti a fallimento invisibile, **entrambi in `proxy.ts`** (D-L proxy, cuore della critical zone §3). Non è localizzabile ulteriormente in read-only. Per il gate del prompt ("root cause in critical zone → STOP AND ASK") e per §5.1 (osservare, non inferire):

**Mi fermo e chiedo.** Opzioni per sbloccare:
1. Alfonso esegue la sonda sopra → dice se `__readonly` è settato (causa 1) o no (causa 2).
2. Se serve vedere lo swallow (causa 2): OK per una **riga temporanea** di instrumentation a `proxy.ts:480` (surface dell'errore), da rimuovere subito dopo.

Solo dopo aver localizzato il break decido il fix minimale (e se tocca `proxy.ts`/critical zone, ri-conferma prima di procedere). BLOCCO 2 (fix shape-live in `ConformanceValidator.ts`) e BLOCCO 3 (test) sono **indipendenti** da questo blocco e possono procedere in parallelo se vuoi.

---

## Hard stop

Nessun edit in questa fase (solo questo report). Il fix del BLOCCO 1 parte dopo la localizzazione runtime del break.
