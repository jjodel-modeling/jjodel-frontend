# Task: Fix 3 bug dal release testing

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

---

## Bug A — CRITICO: Infinite loop React quando si apre un metamodello

### Sintomi
"Maximum update depth exceeded" in console. L'errore parte da `@xyflow_react` StoreUpdater → `setNodes` → re-render infinito. L'error boundary `TryComponent` cattura e rimonta il component tree, l'utente torna alla dashboard.

### Root cause probabile
`ErrorDisplay` (in `ErrorPortal.tsx`) viene renderizzato sul canvas dentro `MeasurableComponent2` (Measurable.tsx:39). `MeasurableComponent2` passa un `ref` a `ErrorDisplay`, ma `ErrorDisplay` è un function component che NON usa `React.forwardRef()`. Questo causa un warning React + probabile re-render loop perché xyflow misura i nodi e il fallimento del ref causa un layout instabile → `setNodes` → re-render → loop.

### Diagnosi obbligatoria

```bash
# 1. Conferma che ErrorDisplay non ha forwardRef
grep -n "forwardRef\|React.forwardRef" src/components/**/ErrorPortal.tsx

# 2. Trova dove ErrorDisplay viene usato come nodo xyflow o dentro Measurable
grep -rn "ErrorDisplay\|ErrorPortal" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules

# 3. Trova MeasurableComponent2 e vedi come passa il ref
grep -n "ref\|forwardRef\|Measurable" src/components/**/Measurable.tsx 2>/dev/null
find src/ -name "Measurable*" -type f
```

### Fix

**Opzione A (preferita)**: Wrappa `ErrorDisplay` con `React.forwardRef`. Il ref ricevuto va attaccato al `<div className='error-badge-slick'>` root:

```typescript
export const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(({
    viewName,
    viewpointName,
    errorType,
    errorContext,
    message,
    dname,
    nodename,
    onClick,
    dataClassName,
}, ref) => {
    // ... stesso codice esistente ...
    
    return (
        <>
            <div
                ref={ref}  // ← AGGIUNGI QUESTO
                className='error-badge-slick'
                // ... resto invariato
            >
                {/* ... */}
            </div>
            <ErrorPortal ... />
        </>
    );
});

ErrorDisplay.displayName = 'ErrorDisplay';
```

**Opzione B (se A non risolve il loop)**: Il problema potrebbe essere più profondo — `ErrorDisplay` cambia dimensioni quando appare/scompare, xyflow misura, chiama `setNodes`, che ri-trigga l'effect. In quel caso:
1. Dai dimensioni fisse al badge: `width: 200px; height: 32px;` (no reflow)
2. Oppure renderizza `ErrorDisplay` FUORI dal nodo xyflow (come overlay posizionato con coordinate assolute)

### Verifica
- Apri un metamodello con classi → ZERO errori "Maximum update depth" in console
- Se ci sono errori di view/template, l'ErrorDisplay appare come badge cliccabile senza crash
- Click sul badge → modale si apre → dismiss → tutto stabile

---

## Bug B — Rimuovere bottom property drawer

### Sintomi  
C'è un pannello/drawer proprietà in basso nell'editor del metamodello che duplica il pannello Properties sulla destra.

### Diagnosi

```bash
# Cerca componenti drawer/bottom-panel nell'editor
grep -rn "drawer\|bottom.*panel\|bottom.*properties\|BottomDrawer\|property.*drawer" \
  src/components/editor-v2/ src/components/abstract/ --include="*.tsx" -l

# Cerca nel file EditorV2.tsx
grep -n "drawer\|bottom\|properties\|panel" src/components/editor-v2/EditorV2.tsx | head -30
```

### Fix
Trova il rendering del bottom drawer/panel nell'editor e rimuovi il JSX che lo renderizza. NON rimuovere il componente stesso (potrebbe servire altrove) — rimuovi solo la sua invocazione nell'editor del metamodello.

Se è condizionale (es. `showBottomPanel && <BottomPanel />`), imposta la condizione a `false` o rimuovi il blocco.

### Verifica
- Apri un metamodello → nessun pannello proprietà in basso
- Il pannello Properties a destra funziona normalmente
- Seleziona un elemento → le proprietà appaiono a destra, non in basso

---

## Bug C — Allineamento icona enumerazione nel canvas

### Sintomi
Nel canvas del metamodello, l'icona dell'enumerazione non è allineata a sinistra come le altre classi. 

### Diagnosi

```bash
# Cerca il componente che renderizza le enumerazioni sul canvas
grep -rn "enum\|Enum\|enumeration" src/components/editor-v2/ --include="*.tsx" --include="*.scss" | \
  grep -i "icon\|align\|text-align\|justify" | head -20

# Oppure cerca la view/template delle enumerazioni
grep -rn "«enum»\|<<enum>>\|stereotype\|enumeration" src/ --include="*.tsx" | head -20
```

### Fix
L'icona o label dell'enumerazione deve avere `text-align: left` (o `justify-self: start` se è grid/flex) coerente con le classi.

### Verifica
- Crea un'enumerazione nel metamodello → l'icona/label è allineata a sinistra come le classi

---

## Vincoli generali
- Zero refactoring opportunistico
- Non toccare file non menzionati
- `npm run build` deve passare
- Aggiornare `docs/claude-code-log.md`

```
## 2026-04-10 — fix: 3 bug release testing (infinite loop, bottom drawer, enum icon)
**Prompt**: fix ErrorDisplay forwardRef (infinite loop xyflow), rimuovi bottom property drawer, allinea icona enum
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [dettagli]
```
