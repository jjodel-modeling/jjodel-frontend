# HANDOVER: Jjodie JjScript Integration Improvements

## DATA
2026-01-31

## CONTESTO
Serie di miglioramenti all'integrazione tra Jjodie (AI assistant) e JjScript (linguaggio di scripting di Jjodel) per migliorare l'esperienza utente nella creazione automatica di metamodelli.

---

## LAVORO COMPLETATO

### 1. AI Genera JjScript invece di JSON

**Problema:** L'AI generava JSON o descrizioni testuali invece di comandi JjScript eseguibili.

**Soluzione:**
- Aggiornato `defaultPrompts.ts` con istruzioni esplicite per generare SOLO JjScript
- Aggiunta sezione "CRITICAL (MUST READ)" nel prompt di chat
- Implementato sistema di migrazione prompt per aggiornare prompt cached in localStorage

**File modificati:**
| File | Modifiche |
|------|-----------|
| `frontend/src/constants/defaultPrompts.ts` | Prompt riscritto con syntax reference JjScript completa |
| `frontend/src/services/PromptService.ts` | Sistema migrazione con `PROMPT_VERSION` e `CRITICAL_MARKERS` |

**Migrazione Prompt:**
```typescript
const CRITICAL_MARKERS: Partial<Record<PromptType, string[]>> = {
    chat: ['JjScript', 'create class', '```jjscript', 'conversational, flowing style'],
};
const PROMPT_VERSION = 3;

private static runMigration(): void {
    // Reset cached prompts che non contengono i marker critici
    for (const [type, markers] of Object.entries(CRITICAL_MARKERS)) {
        const globalPrompt = this.getGlobalPromptRaw(type as PromptType);
        if (globalPrompt && markers) {
            const isMissingMarkers = markers.some(marker =>
                !globalPrompt.content.includes(marker)
            );
            if (isMissingMarkers) {
                this.resetGlobalPrompt(type as PromptType);
            }
        }
    }
    localStorage.setItem(PROMPT_VERSION_KEY, String(PROMPT_VERSION));
}
```

---

### 2. ScriptBlock: Fix STEP to RUN Continuation

**Problema:** Cliccando "Run" dopo "Step" ripartiva dall'inizio, tentando di ricreare elementi già esistenti.

**Soluzione:** `handleExecute` ora continua da `currentLineIndex` invece di ripartire da 0.

**File modificato:** `frontend/src/jjscript/components/ScriptBlock.tsx`

```typescript
const handleExecute = useCallback(async () => {
    // If we were stepping/paused, continue from current position
    const startIndex = (executionState === 'paused' || executionState === 'stepping')
        ? currentLineIndex
        : 0;

    // Reset only lines from startIndex onwards
    if (startIndex === 0) {
        setLineStates(prev => prev.map(ls => ({ ...ls, status: 'pending', result: undefined })));
    } else {
        setLineStates(prev => prev.map((ls, idx) =>
            idx >= startIndex ? { ...ls, status: 'pending', result: undefined } : ls
        ));
    }

    for (let i = startIndex; i < commands.length; i++) { ... }
}, [commands, onExecute, executionState, currentLineIndex]);
```

---

### 3. ScriptBlock: Light Theme

**Problema:** Il tema scuro del code block non era consistente con il design light-mode di Jjodel.

**Soluzione:** Migrato da `oneDark` a `oneLight` theme.

**File modificati:**
| File | Modifiche |
|------|-----------|
| `frontend/src/jjscript/components/ScriptBlock.tsx` | Import `oneLight`, custom theme basato su light |
| `frontend/src/jjscript/components/ScriptBlock.scss` | Variabili light theme, hover states aggiornati |

**Nuove variabili SCSS:**
```scss
$script-bg: #f8fafc;
$script-bg-header: #f1f5f9;
$script-border: #e2e8f0;
$script-text: #1e293b;
$script-text-muted: #64748b;
```

---

### 4. ChatMessages: Redux Store Subscription per Rilevamento Metamodel

**Problema:** Dopo aver creato un metamodello, l'esecuzione JjScript continuava a mostrare "no metamodel" error.

**Causa root:** `useMemo` con dependency `[messages]` non reagiva ai cambiamenti Redux store.

**Soluzione:** Sostituito `useMemo` con `useState` + `store.subscribe()`.

**File modificato:** `frontend/src/components/Jodie/ChatMessages.tsx`

```typescript
// Helper function to get project context
const getProjectContext = useCallback(() => {
    try {
        const user: LUser = L.fromPointer(DUser.current);
        if (!user?.project) {
            return { hasProject: false, hasMetamodel: false, metamodelName: null, metamodelCount: 0 };
        }
        const project = user.project as LProject;
        const metamodels = (project as any).metamodels || [];
        // ... logic per active metamodel
    } catch {
        return { hasProject: false, hasMetamodel: false, metamodelName: null, metamodelCount: 0 };
    }
}, []);

// State invece di useMemo
const [projectContext, setProjectContext] = useState(() => getProjectContext());

// Subscribe to Redux store changes
useEffect(() => {
    setProjectContext(getProjectContext());

    const unsubscribe = store.subscribe(() => {
        const newContext = getProjectContext();
        setProjectContext(prev => {
            if (prev.hasProject !== newContext.hasProject ||
                prev.hasMetamodel !== newContext.hasMetamodel ||
                prev.metamodelCount !== newContext.metamodelCount) {
                return newContext;
            }
            return prev;
        });
    });

    return () => unsubscribe();
}, [getProjectContext]);
```

---

### 5. Stile Risposta AI Migliorato

**Problema:** AI generava troppi bullet points e liste.

**Soluzione:** Aggiunto `RESPONSE STYLE` section nel prompt:

```
Write in a conversational, flowing style. Avoid excessive bullet points
and lists - prefer writing in complete paragraphs that explain concepts
naturally. When you provide JjScript code, introduce it with a brief
explanation of what it does and why, then show the code block.
```

---

### 6. Messaggi Errore Migliorati

**Problema:** Messaggi di errore generici quando mancava progetto/metamodello.

**Soluzione:** Messaggi specifici e actionable:

| Caso | Messaggio |
|------|-----------|
| No project | "Per eseguire questo script, apri prima un progetto." |
| No metamodel | "Il progetto non ha metamodelli. Clicca '+ New' nella sezione METAMODELS per crearne uno, poi esegui di nuovo lo script." |

---

### 7. Rimosso Dead Code

**File eliminato:** `frontend/src/constants/jjodiePrompt.ts`

Questo file non era importato da nessuna parte e causava confusione su quale prompt venisse effettivamente utilizzato.

---

## PATTERN TECNICI

### Redux Store Subscription Pattern

Quando un componente React deve reagire a cambiamenti Redux che NON sono nelle props/dependencies:

```typescript
// Pattern consigliato
const [state, setState] = useState(() => computeFromRedux());

useEffect(() => {
    setState(computeFromRedux()); // Initial sync

    const unsubscribe = store.subscribe(() => {
        const newValue = computeFromRedux();
        setState(prev => {
            if (shouldUpdate(prev, newValue)) return newValue;
            return prev;
        });
    });

    return () => unsubscribe();
}, []);
```

---

## FILES MODIFICATI

| File | Tipo | Descrizione |
|------|------|-------------|
| `frontend/src/constants/defaultPrompts.ts` | Modificato | Prompt JjScript-only + response style |
| `frontend/src/services/PromptService.ts` | Modificato | Sistema migrazione prompt |
| `frontend/src/jjscript/components/ScriptBlock.tsx` | Modificato | STEP→RUN fix + light theme |
| `frontend/src/jjscript/components/ScriptBlock.scss` | Modificato | Light theme variables |
| `frontend/src/components/Jodie/ChatMessages.tsx` | Modificato | Redux subscription per context |
| `frontend/src/constants/jjodiePrompt.ts` | Eliminato | Dead code rimosso |

---

## TESTING CHECKLIST

- [ ] Creare nuovo progetto
- [ ] Chiedere a Jjodie "Create a Book class" → deve generare JjScript
- [ ] Cliccare STEP su uno script multi-line
- [ ] Cliccare RUN dopo STEP → deve continuare, non ripartire
- [ ] Creare metamodello mentre chat è aperta → badge verde appare
- [ ] Eseguire script dopo creazione metamodello → deve funzionare
- [ ] Verificare tema light nel code block

---

## TODO / PROSSIMI PASSI

1. ⬜ Integrazione autocomplete UI nella chat (dropdown suggerimenti)
2. ⬜ Undo/redo per esecuzione JjScript
3. ⬜ Progress indicator durante esecuzione script lunghi
4. ⬜ History dei comandi eseguiti

---

*Ultimo aggiornamento: 2026-01-31*
