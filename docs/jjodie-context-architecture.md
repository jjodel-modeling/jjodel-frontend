# Jjodie — Context Detection & System Prompt Architecture

> Report di esplorazione architetturale — 2026-03-22
> Scopo: documentare come Jjodie rileva il contesto dell'artefatto attivo e costruisce il system prompt.

---

## Flow Completo

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────┐
│ Artefatto    │───→│ Context          │───→│ Template         │───→│ System Prompt   │───→│ LLM │
│ attivo       │    │ Detection        │    │ Rendering        │    │ finale          │    │     │
│ (Redux)      │    │ (JjodieContext)  │    │ (PromptService)  │    │ (AIProvider)    │    │     │
└──────────────┘    └──────────────────┘    └──────────────────┘    └─────────────────┘    └─────┘
       │                                            │
       │                                    ┌───────┴───────┐
       ▼                                    │ RAG Service   │
  ┌──────────┐                              │ (augmentation)│
  │ Badge UI │                              └───────────────┘
  │ (header) │
  └──────────┘
```

---

## Step 1 — Artefatto Attivo (Redux)

**File:** `frontend/src/redux/selectors/selectors.ts` — `getActiveModel()`
**Meccanismo:** Legge `state._lastSelected.modelElement` — l'ultimo elemento cliccato dall'utente in qualsiasi editor.

**Tipo artefatto:** Determinato dalla flag booleana `DModel.isMetamodel` impostata alla creazione dell'oggetto. Non c'è enum né detection runtime — è un flag persistente.

**Limitazione:** Se l'utente non ha cliccato nessun elemento, `_lastSelected.modelElement` è null e `getActiveModel()` ritorna null.

---

## Step 2 — Context Badge (solo UI, non collegato al prompt)

**File:** `frontend/src/components/Jodie/JodieHeader.tsx` (righe 31-74)
**Hook:** `useMetamodelContext()` — sottoscrive `store.subscribe()` e chiama `getMetamodelContext()` ad ogni cambio di stato.

Il badge mostra il nome del metamodello attivo. Se nessun elemento è selezionato, fa fallback a `metamodels[0]` del progetto.

**IMPORTANTE:** Il badge è **puramente visuale**. NON è collegato al percorso di costruzione del prompt. Il prompt ignora l'editor attivo e legge l'intero progetto.

---

## Step 3 — Context Assembly (strutturale)

**File principale:** `frontend/src/components/Jodie/Jodie.tsx` (riga 76, `getProjectContext()`)
**Servizio:** `frontend/src/services/JjodieContext.ts`

### Flow interno:

```typescript
// Jodie.tsx:76
getProjectContext()
  → DUser.current                          // puntatore Redux all'utente loggato
  → L.fromPointer(DUser.current) as LUser
  → user.project as LProject
  → JjodieContextService.getContextString(project)
```

### JjodieContextService — Due fasi:

#### Fase A: `extractFromProject(project)` (riga ~67)
Estrae dal progetto:
- `project.packages` — solo nomi
- `project.classes` — TUTTE le classi da TUTTI i metamodelli del progetto
  - Per ogni classe: attributi (nome, tipo via `getTypeName()`, molteplicità), references (nome, target, composizione/associazione, molteplicità), extends (nomi superclassi)
- `project.enumerators` — nome + nomi literal

#### Fase B: `buildContextString(context)` (riga ~177)
Produce una stringa Markdown tipo:
```
**Project**: MyProject
**Metamodel Size**: 3 metaclasses
...
```

### Risultato: `projectContext: string | undefined`

---

## Step 4 — RAG Augmentation

**File:** `frontend/src/services/JjodieRagService.ts` (riga ~374)

```typescript
JjodieRagService.getAugmentedContext(content)
  → retriever.searchForContext(query, 1500)
  → returns top retrieved text chunks
```

Se RAG trova contenuto rilevante, viene concatenato:
```typescript
augmentedContext = `${projectContext}\n\n---\n\n**Relevant Information:**\n${ragContext}`
```

**Re-indexing:** polling ogni 30 secondi (`Jodie.tsx:156`) con hash check. Modifiche strutturali tra un ciclo e l'altro sono invisibili.

---

## Step 5 — System Prompt Construction

**File:** `frontend/src/services/AIProviderService.ts` (righe 40-43)

```typescript
context = { customVariables: { projectContext: augmentedContext } }
systemPrompt = PromptService.getRendered('chat', context)
```

### PromptService — Cascade di risoluzione

**File:** `frontend/src/services/PromptService.ts` (riga ~97)

```
1. localStorage: override per progetto (projectId)  → MAI usato (projectId non passato)
2. localStorage: override globale
3. DEFAULT_PROMPTS['chat']  → fallback
```

### Template Engine (riga ~277)

`renderTemplate(template, context)` supporta:
- `{{variable}}` — interpolazione semplice
- `{{#if variable}}...{{/if}}` — blocchi condizionali
- `{{#each array}}...{{/each}}` — iterazione

**Template default:** `frontend/src/constants/defaultPrompts.ts` — contiene `CHAT_PROMPT`

---

## Step 6 — LLM Call

Il `systemPrompt` renderizzato viene inviato al provider:
- **Claude:** campo `system`
- **OpenAI-compatible:** primo messaggio `{ role: 'system' }`

---

## BUG CRITICO: Il contesto del progetto non arriva al prompt

Il `augmentedContext` assemblato in `Jodie.tsx:309-325` viene passato a `AIProviderService.chat()` come `projectContext`, wrappato in `customVariables: { projectContext }`.

**Ma il template `CHAT_PROMPT` non contiene `{{projectContext}}`.**

Il template usa `{{#if projectName}}` e `{{#if classCount}}`, ma queste variabili **non vengono mai popolate** nel call path. I campi tipizzati di `PromptContext` (`projectName`, `classCount`, `classes[]`, `metamodelName`, `userName`) sono dichiarati nel tipo (`frontend/src/types/prompts.ts`) ma mai impostati.

**Risultato:** Il contesto strutturale del metamodello viene assemblato, augmentato con RAG, e poi **silenziosamente scartato**. L'LLM riceve solo il prompt statico di default.

---

## Variabili Disponibili

### Dichiarate in `PromptContext` (ma MAI popolate):
| Variabile | Tipo | Stato |
|-----------|------|-------|
| `projectName` | `string` | Mai impostata |
| `classCount` | `number` | Mai impostata |
| `classes[]` | `array` | Mai impostata |
| `metamodelName` | `string` | Mai impostata |
| `userName` | `string` | Mai impostata |

### Effettivamente passate:
| Variabile | Dove | Stato |
|-----------|------|-------|
| `customVariables.projectContext` | `AIProviderService.ts:41` | Passata ma **mai letta** dal template |

---

## Cosa Funziona Oggi

1. **Estrazione strutturale** — `JjodieContextService.getContextString()` estrae correttamente classi, attributi, references, enumerazioni e package dal progetto
2. **RAG** — indicizza contenuto progetto e documentazione JjScript; retrieval per query funziona end-to-end
3. **Badge header** — mostra correttamente il nome del metamodello attivo
4. **Cascade dei prompt** — progetto → globale → default con persistenza localStorage
5. **JjScript fast path** — `Jodie.tsx:186` intercetta slash command prima della chiamata LLM

---

## Cosa Manca

| Gap | Dettaglio |
|-----|-----------|
| **Contesto non iniettato nel prompt** | `projectContext` assemblato ma mai inserito nel template (bug critico) |
| **Contesto è project-level, non artifact-level** | `extractFromProject()` legge `project.classes` aggregando TUTTI i metamodelli — l'editor/tab attivo non è consultato |
| **Modelli M1 non inclusi** | Le istanze `DObject` non sono mai estratte |
| **Trasformazioni JjTL non incluse** | Gli script di trasformazione non sono mai estratti |
| **Grafi non inclusi** | Lo stato dei grafi non è mai estratto |
| **`projectId` mai passato** | Override prompt per-progetto mai consultati |
| **Named fields mai popolati** | I blocchi `{{#if projectName}}` nel template sono sempre vuoti |

---

## Punti Fragili e Dipendenze Non Ovvie

1. **`DUser.current`** — tutto il pipeline di contesto parte da questo puntatore globale. Se non è impostato o Redux non è hydrated, `getProjectContext()` ritorna `undefined` silenziosamente
2. **`LProject.classes` è un'aggregazione computed** — mergia classi da tutti i `project.metamodels`. Comportamento con zero o multipli metamodelli potenzialmente inatteso
3. **`_lastSelected` nullo all'apertura** — se l'utente non ha cliccato nulla, badge fa fallback a `metamodels[0]` che potrebbe non essere quello atteso
4. **Due `getProjectContext` diverse** — una in `Jodie.tsx` (ritorna stringa per il prompt) e un'altra in `ChatMessages.tsx` (ritorna oggetto tipizzato per JjScript guard). Naming collision fuorviante
5. **`JjodieWidget`** — componente vecchio in `frontend/src/components/JjodieWidget/JjodieWidget.tsx`, demo separata con risposte keyword-based, no contesto, no LLM. Probabile codice morto

---

## File Essenziali

| File | Ruolo |
|------|-------|
| `components/Jodie/Jodie.tsx` | Orchestratore principale: assembly contesto, dispatch messaggi, coordinamento RAG |
| `services/JjodieContext.ts` | Conversione progetto→contesto: `extractFromProject()` + `buildContextString()` |
| `services/AIProviderService.ts` | Layer chiamata LLM; costruzione system prompt (righe 40-43) |
| `services/PromptService.ts` | Cascade risoluzione prompt + `renderTemplate()` engine |
| `constants/defaultPrompts.ts` | Template system prompt di default (`CHAT_PROMPT`) |
| `types/prompts.ts` | Interfaccia `PromptContext` (variabili dichiarate ma non usate) |
| `components/Jodie/JodieHeader.tsx` | Badge contesto artefatto: `getMetamodelContext()` + `useMetamodelContext()` |
| `services/JjodieRagService.ts` | Pipeline RAG: indicizzazione e retrieval |
| `components/Jodie/ChatMessages.tsx` | Gate esecuzione JjScript; secondo `getProjectContext` (tipo diverso) |
| `redux/selectors/selectors.ts` | `getActiveModel()` — legge `_lastSelected.modelElement` |
