# Handover: JjTL Attribute Mapping Bug Fix

**Data:** 2026-02-08 / 2026-02-09  
**Sessione:** Debugging e fix del bug attribute mapping in JjTL transformations  
**Stato:** ✅ RISOLTO

---

## Problema

La trasformazione JjTL `A -> B { name -> label }` creava correttamente le istanze target (B_0, B_1) ma il valore dell'attributo `label` restava `undefined`/`null` invece di copiare il valore da `name` del source.

## Root Causes Identificate (3 bug)

### Bug 1: Executor — `evaluatePropertyPath("name")` ritornava `null` ✅ RISOLTO
- **Causa:** `contextToRecord()` restituiva solo variabili hardcoded (`source`, `self`, `it`, `data`) ma NON le proprietà dell'istanza source
- **Fix:** Aggiunto accesso diretto alle proprietà del source object in `evaluatePropertyPath` + fix di `contextToRecord` per passare le proprietà dell'istanza al contesto JjEL
- **File:** `frontend/src/jjtl/executor/executor.ts`

### Bug 2: ProjectEditor — DObject.new() ID mismatch ✅ RISOLTO
- **Causa:** `DObject.new()` ritorna un ID temporaneo che NON corrisponde all'ID reale usato dal framework Jjodel. Gli oggetti non sono accessibili tramite `store.getState()[dObject.id]` — il framework usa un layer di proxy/indirezione
- **Fix:** Invece di cercare per ID nello store Redux, si usa il proxy LModel per trovare gli oggetti per **nome** e si settano i valori tramite proxy `.$attributeName.value = value`
- **File:** `frontend/src/components/project/ProjectEditor.tsx`

### Bug 3: Source model className — `UnknownClass` (minor, pre-esistente)
- **Causa:** In alcune esecuzioni il source model data arriva con className non risolto
- **Stato:** Mitigato dai fallback di risoluzione className già presenti. Succede solo nella seconda esecuzione automatica (doppio rendering)

## Soluzioni Applicate

### Executor (`executor.ts`)

```typescript
// evaluatePropertyPath ora prova:
// 1. Context variable lookup (proprietà dell'istanza source)
// 2. Direct access su source object
// 3. JjEL evaluation per path complessi
// 4. Manual traversal per dotted paths

// contextToRecord ora include:
// - Variabili hardcoded (source, self, it, data, classes, instances)
// - TUTTE le proprietà dell'istanza source (name, label, ecc.)
```

### ProjectEditor (`ProjectEditor.tsx`)

```typescript
// Pattern definitivo per settare attributi dopo una TRANSACTION:

// 1. Dentro TRANSACTION: crea DObject, accumula pending per NOME (non ID!)
const pendingAttributeSets: Array<{
    objectName: string;  // ← NOME, non ID!
    className: string;
    attributes: Record<string, any>;
}> = [];

// 2. Dopo TRANSACTION: usa setTimeout + LModel proxy
setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    const objects = lModel.objects || [];
    
    for (const pending of pendingAttributeSets) {
        const lObject = objects.find(o => o.name === pending.objectName);
        for (const [attrName, attrValue] of Object.entries(pending.attributes)) {
            (lObject as any)['$' + attrName].value = attrValue;
        }
    }
}, 1000);
```

## Scoperte Architetturali Importanti

1. **DObject.new() IDs sono temporanei** — l'ID restituito non corrisponde all'ID finale nel sistema. Non usare `store.getState()[dObject.id]` per ritrovare gli oggetti
2. **store.getState()[id] non funziona** per gli oggetti Jjodel — il framework usa un layer di proxy. Anche gli ID reali (visibili tramite `data.allSubObjects[0].id`) non sono chiavi dirette nello store
3. **Il modo corretto di scrivere valori** è tramite il proxy LObject: `lObject.$attributeName.value = value`. NON `SetFieldAction` diretto
4. **Il modo corretto di trovare oggetti** è tramite `LPointerTargetable.fromD(modelId)` → `lModel.objects.find(o => o.name === name)`
5. **Timing:** dopo `DObject.new()` dentro una TRANSACTION, gli oggetti e le loro features non sono immediatamente disponibili. Serve un delay (~1 secondo) prima di poter accedere ai proxy

## File Modificati

- `frontend/src/jjtl/executor/executor.ts` — evaluatePropertyPath, contextToRecord
- `frontend/src/components/project/ProjectEditor.tsx` — handleExecuteTransformation (STEP 8)

## Test di Verifica

```javascript
// Nella JjEL console, sul modello target:
data.allSubObjects.map(a => a.name + ' ' + a.$label.value)
// Atteso: ["B_0 A_0", "B_1 A_1"]
```

## Bug Minori Residui

1. **Valore duplicato:** In alcuni casi entrambi gli oggetti B ricevono lo stesso valore (`A_0` su entrambi). Da verificare se è un problema nell'executor o nel ProjectEditor
2. **Doppia esecuzione:** L'executor viene chiamato due volte — la seconda volta con dati sbagliati (`UnknownClass`). Probabilmente legato al doppio rendering React
3. **Conversion expressions:** Da testare `name -> label : name + '_pippo'` per verificare che JjEL evaluation funzioni end-to-end

## Prossimi Step

- [ ] Fix valore duplicato (B_1 riceve A_0 invece di A_1)
- [ ] Test conversion expressions con JjEL
- [ ] Rimuovere log di debug eccessivi una volta stabilizzato
- [ ] Gestire errori "Error in View: Fallback" nel modello target
- [ ] Test con trasformazioni multi-attributo (name -> label, type -> kind)
