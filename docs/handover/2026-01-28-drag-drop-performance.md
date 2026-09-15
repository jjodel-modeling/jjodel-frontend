# HANDOVER: Sessione Drag & Drop e Performance Fix

## DATA
2026-01-28

## CONTESTO
Sessione di implementazione drag & drop per features (Attribute, Reference, Operation) nel metamodel editor di Jjodel, seguita da investigazione e fix di problemi di performance.

---

## LAVORO COMPLETATO

### 1. Drag & Drop Features

**Obiettivo:** Permettere di trascinare Attribute/Reference/Operation dalla sidebar e dropparli su una Class per crearli.

**File modificati:**

#### `frontend/src/graph/graphElement/graphElement.tsx`
- **Linea ~271-273:** Aggiunto check su `pendingCreation` per evitare creazione duplicata di DGraph
```typescript
// PRIMA:
if (!graph) {
    if (ret.data) CreateElementAction.new(DGraph.new(0, ret.data.id, parentnodeid, graphid, graphid));
}

// DOPO:
if (!state.idlookup[graphid] && !DPointerTargetable.pendingCreation[graphid]) {
    if (ret.data) CreateElementAction.new(DGraph.new(0, ret.data.id, parentnodeid, graphid, graphid));
}
```

- **Linee ~344-348:** RIMOSSA la cleanup di pendingCreation (era una fix temporanea)

#### `frontend/src/redux/reducer/reducer.ts`
- **Linea ~443:** Il `delete DPointerTargetable.pendingCreation[elem.id]` è stato RIPRISTINATO (non commentato)

- **Linee ~219-232:** Modificato per silenziare i log di reject
```typescript
// PRIMA: loggava errore e faceva continue
// DOPO: silently skip senza log
if (action.type === CreateElementAction.type && current[key]) {
    let inCollabNode = Collaborative.online && action.value.className.toLowerCase().includes('graph');
    if (inCollabNode) return false;
    continue; // silently skip
}
```

#### `frontend/src/components/abstract/tabs/MetamodelTab.tsx`
- **Linee ~72-77:** Aggiunto check su `pendingCreation` prima di creare DGraph
```typescript
if (!graph) {
    const graphid = Constructors.DGraph_makeID(model);
    if (!DPointerTargetable.pendingCreation[graphid]) {
        DGraph.new(0, model.id);
    }
    return(...);
}
```

#### `frontend/src/components/abstract/tabs/ModelTab.tsx`
- **Linee ~14-19:** Stesso fix di MetamodelTab

#### `frontend/src/joiner/proxy.ts`
- **Linea ~272:** Silenziato log "failed to get property"
```typescript
// Log.eDevv('failed to get property', {targetObj, propKey, e}); // Silenced
```

#### `frontend/src/graph/graphElement/graphElement.tsx`
- **Linee ~993-1000:** Ridotto logging loop detection
```typescript
console.debug("loop in \""+v.name+"\".onDataUpdate - event disabled until view changes");
```

---

### 2. View Templates (Viewpoints)

#### View Class
- Template aggiornato con:
  - Header con label "Class:" e nome
  - Body con sezioni per attributes, references, operations
  - Separatori tratteggiati tra sezioni
  - Handlers drag & drop (onDragOver, onDragLeave, onDrop) - **RIMOSSI temporaneamente per performance**
  - `onDataUpdate` event **RIMOSSO** per evitare loop

#### View Attribute
- "Apply to" impostato su vuoto (non "Attribute") per permettere matching
- Template con icona, nome, ":", e Select per il tipo
- Check null safety: `data.type && data.type.model`

#### View Reference
- Stesso pattern di Attribute

#### View Operation
- Stesso pattern di Attribute, con "()" dopo il nome

#### View Fallback
- Fixato errore di null check su `parentView`

---

## PROBLEMA IN SOSPESO: Performance

### Sintomi
- ~10,000+ messaggi in console
- ~1,600+ errori
- CreateElementAction chiamata ripetutamente per elementi già esistenti
- Loop detection che scatta frequentemente

### Cause identificate
1. **Race condition pendingCreation** — parzialmente fixata
2. **DGraph creati in loop** in `graphElement.tsx`, `MetamodelTab.tsx`, `ModelTab.tsx` — fixato
3. **onDataUpdate loop** nelle View — richiede investigazione
4. **Accesso a proprietà inesistenti** via proxy — silenziato ma non risolto

### Stato
- Le fix applicate hanno ridotto gli errori da migliaia a centinaia, ma il problema persiste
- L'interfaccia è utilizzabile ma non ottimale
- Il problema è **preesistente** e non causato direttamente dalle modifiche di questa sessione

### Prossimi passi per investigare
1. Controllare le Observed properties di tutte le View per dipendenze circolari
2. Verificare gli `onDataUpdate` definiti nelle View nei Viewpoints
3. Analizzare lo stack trace completo per identificare la fonte del loop
4. Considerare di disabilitare temporaneamente il loop detection per vedere se migliora le performance

---

## API Scoperte

### Creazione elementi
```typescript
// Creare un child element (attribute, reference, operation)
const element = data.addChild('attribute'); // Restituisce una funzione
try { (element)(); } catch(e) { } // Eseguire la funzione

// NON funziona:
// data.$attribute.addObject(...)
// data.attributes.addObject(...)
// data.addAttribute(...)
```

### Drag & Drop in View
```typescript
onDragOver={(e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}}
onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('application/json');
    // ... process drop
}}
```

### Limitazioni Jjodel compiler
- **NO optional chaining**: `data?.type?.model` → errore di sintassi
- **Usare &&**: `data.type && data.type.model && data.type.model.id`

---

## FILE CHIAVE

| File | Scopo |
|------|-------|
| `frontend/src/graph/graphElement/graphElement.tsx` | Rendering elementi grafici, mapStateToProps |
| `frontend/src/redux/reducer/reducer.ts` | Redux reducer, gestione CreateElementAction |
| `frontend/src/joiner/proxy.ts` | Proxy handler per oggetti Jjodel |
| `frontend/src/components/abstract/tabs/MetamodelTab.tsx` | Tab editor metamodel |
| `frontend/src/components/abstract/tabs/ModelTab.tsx` | Tab editor model |
| `frontend/src/components/FeaturesPalette/FeaturesPalette.tsx` | Sidebar features draggabili |

---

## COMANDI UTILI
```bash
# Verificare pendingCreation
grep -rn "pendingCreation" frontend/src/ --include="*.ts" --include="*.tsx"

# Verificare CreateElementAction
grep -rn "CreateElementAction.new" frontend/src/ --include="*.tsx"

# Verificare loop detection
grep -rn "onDataUpdate\|loop in" frontend/src/graph/graphElement/graphElement.tsx
```

---

## PROSSIMA SESSIONE

1. ❌ Fix performance (in sospeso)
2. → Continuare con Jjodie chat assistant
3. → Styling professionale delle classi/features
4. → Features Palette sempre espansa
5. → Overview cards nel Properties panel
