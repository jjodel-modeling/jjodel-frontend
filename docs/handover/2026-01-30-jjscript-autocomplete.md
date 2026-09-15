# HANDOVER: JjScript Autocomplete Engine

## DATA
2026-01-30

## CONTESTO
Implementazione del motore di autocomplete per JjScript, il linguaggio di scripting di Jjodel. Il sistema fornisce suggerimenti intelligenti e context-aware durante la digitazione di comandi nella chat di Jjodie.

---

## LAVORO COMPLETATO

### Sistema Autocomplete Completo

**Directory creata:** `frontend/src/jjscript/autocomplete/`

| File | Descrizione |
|------|-------------|
| `types.ts` | Definizioni tipi e costanti (comandi, elementi, keywords) |
| `context.ts` | Rilevamento contesto per input parziale |
| `ranking.ts` | Sistema di ranking e scoring suggerimenti |
| `engine.ts` | Motore principale autocomplete |
| `index.ts` | Barrel exports |
| `providers/keyword.ts` | Provider per comandi e keywords |
| `providers/metamodel.ts` | Provider per elementi del metamodello |
| `providers/type.ts` | Provider per tipi primitivi |
| `providers/index.ts` | Export providers |

---

## ARCHITETTURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOCOMPLETE ENGINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Input: "create cl▌"                                       │
│                    │                                             │
│                    ▼                                             │
│         ┌─────────────────┐                                     │
│         │ CONTEXT DETECTOR│                                     │
│         │  (context.ts)   │                                     │
│         └────────┬────────┘                                     │
│                  │                                               │
│     ParseContext: element_type                                   │
│     CurrentWord: "cl"                                            │
│     Command: "create"                                            │
│                  │                                               │
│     ┌────────────┼────────────┐                                 │
│     ▼            ▼            ▼                                 │
│ ┌────────┐ ┌──────────┐ ┌────────┐                             │
│ │Keyword │ │Metamodel │ │ Type   │                             │
│ │Provider│ │ Provider │ │Provider│                             │
│ └────┬───┘ └────┬─────┘ └───┬────┘                             │
│      │          │           │                                   │
│      └──────────┼───────────┘                                   │
│                 ▼                                                │
│        ┌─────────────────┐                                      │
│        │     RANKER      │                                      │
│        │  (ranking.ts)   │                                      │
│        └────────┬────────┘                                      │
│                 │                                                │
│                 ▼                                                │
│    Suggestions: [class, clear, ...]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CONTESTI DI PARSING

Il sistema rileva automaticamente il contesto basandosi sull'input parziale:

| Context | Descrizione | Esempio Input |
|---------|-------------|---------------|
| `start` | Inizio input | "" o "/" |
| `command` | Digitando comando | "cre" |
| `element_type` | Dopo comando, aspetta tipo | "create cl" |
| `name` | Aspetta nome elemento | "create class Per" |
| `target` | Aspetta riferimento | "delete Per" |
| `type` | Aspetta tipo dati | "create attribute name in Person type S" |
| `multiplicity` | Aspetta [0..1], etc | "type String [" |
| `keyword` | Aspetta keyword | "create class Person ext" |
| `property` | Aspetta proprietà | "set Person." |
| `value` | Aspetta valore | "set Person.abstract = " |

---

## PROVIDERS

### KeywordProvider (priority: 100)
Fornisce suggerimenti per:
- Comandi (`create`, `delete`, `rename`, etc.)
- Tipi elemento (`class`, `attribute`, `reference`, etc.)
- Keywords (`in`, `to`, `type`, `extends`, etc.)

### MetamodelProvider (priority: 90)
Fornisce suggerimenti da metamodello corrente:
- Classi esistenti
- Enumerazioni
- Package
- Attributi e riferimenti (con dot notation)

### TypeProvider (priority: 85)
Fornisce suggerimenti per tipi:
- Tipi primitivi (`String`, `Integer`, `Boolean`, etc.)
- Molteplicità (`[0..1]`, `[1..*]`, etc.)

---

## SISTEMA DI RANKING

I suggerimenti vengono ordinati combinando:

1. **Priority base** - Impostata dal provider
2. **Match quality** - Quanto bene il testo corrisponde
   - Exact match: +30
   - Prefix match: +20 * ratio
   - Contains: +5
   - Fuzzy: 0-10
3. **Recency bonus** - Comandi usati di recente
4. **Context relevance** - Pertinenza al contesto
5. **Type bonus** - Boost per tipi comuni

---

## API PRINCIPALE

### Uso Base

```typescript
import { getSuggestions, applySuggestion } from 'jjscript/autocomplete';

// Ottenere suggerimenti
const suggestions = getSuggestions('create cl');
// Returns: [{ text: 'class', type: 'keyword', ... }, { text: 'clear', type: 'command', ... }]

// Applicare suggerimento selezionato
const { text, cursorPosition } = applySuggestion(input, suggestions[0]);
```

### Con Contesto Metamodello

```typescript
import { setMetamodelContext, getSuggestions } from 'jjscript/autocomplete';

// Impostare contesto metamodello
setMetamodelContext({
    classes: [
        { id: '1', name: 'Person', isAbstract: false, isInterface: false, attributes: [...], references: [...], operations: [] }
    ],
    enums: [],
    packages: []
});

// Ora i suggerimenti includeranno elementi del metamodello
const suggestions = getSuggestions('delete P');
// Returns: [{ text: 'Person', type: 'class', description: 'Class (2 attrs, 1 refs)', ... }]
```

### Singleton Engine

```typescript
import { getAutocompleteEngine } from 'jjscript/autocomplete';

const engine = getAutocompleteEngine();

// Configurare opzioni
engine.setOptions({
    maxSuggestions: 15,
    minChars: 2,
    includeSnippets: true
});

// Registrare provider custom
engine.registerProvider(myCustomProvider);

// Aggiungere comando recente per recency boosting
engine.addRecentCommand('create');
```

---

## INTEGRAZIONE CON JJSCRIPTSERVICE

`JjScriptService` è stato aggiornato per usare il nuovo engine:

```typescript
// Suggerimenti semplici (backward compatible)
const suggestions: string[] = JjScriptService.getSuggestions('create');

// Suggerimenti completi con metadata
const fullSuggestions: Suggestion[] = JjScriptService.getFullSuggestions('create', cursorPos);

// Registra comando per recency boosting (chiamato automaticamente su execute success)
JjScriptService.recordCommand('create');
```

---

## TIPI SUGGERIMENTO

```typescript
type SuggestionType =
    | 'command'      // /create, /delete, etc.
    | 'keyword'      // class, enum, in, to, etc.
    | 'class'        // Classi dal metamodello
    | 'attribute'    // Attributi
    | 'reference'    // Riferimenti
    | 'type'         // Tipi primitivi
    | 'enum'         // Enumerazioni
    | 'literal'      // Valori enum
    | 'package'      // Package
    | 'property'     // Proprietà per set
    | 'value'        // Valori
    | 'snippet';     // Template completi
```

---

## FILES MODIFICATI

| File | Modifiche |
|------|-----------|
| `frontend/src/jjscript/index.ts` | Aggiunti export autocomplete |
| `frontend/src/jjscript/services/JjScriptService.ts` | Integrazione engine, `getFullSuggestions()`, `recordCommand()` |

---

## TODO / PROSSIMI PASSI

1. ⬜ Integrazione UI in JodieWindow per dropdown suggerimenti
2. ⬜ Snippet templates per comandi complessi
3. ⬜ Provider smart con suggerimenti ML-based
4. ⬜ Cache per performance con metamodelli grandi
5. ⬜ React hook `useAutocomplete` per facile integrazione

---

## NOTE TECNICHE

### Vantaggi Architettura Provider

1. **Estensibilità**: Facile aggiungere nuovi provider
2. **Separazione responsabilità**: Ogni provider gestisce un dominio
3. **Priorità configurabile**: Provider con priorità più alta eseguiti prima
4. **Fallback graceful**: Se un provider fallisce, gli altri continuano

### Fuzzy Matching

Il sistema usa un semplice algoritmo fuzzy che:
- Verifica se tutti i caratteri del filtro appaiono in ordine nel testo
- Premia match consecutivi
- Non richiede dipendenze esterne

### Prestazioni

- Tokenizzazione O(n) dove n = lunghezza input
- Lookup suggerimenti O(m) dove m = numero elementi metamodello
- Ranking O(k log k) dove k = numero suggerimenti

---

*Ultimo aggiornamento: 2026-01-30*
