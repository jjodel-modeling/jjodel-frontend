# Handover Document - 2025-01-28
## Jjodie Chat Redesign + Drag & Drop Features + UI Styling

---

## SOMMARIO SESSIONE
Questa sessione ha coperto:
1. Redesign della chat Jjodie (FAB hover, tooltip)
2. Error Modal - aggiunto className dell'oggetto
3. Styling classi e attributi nel canvas (font, allineamento, select width)
4. Monaco editor minimum height
5. Toggle centralizzati nel form system

---

## 1. JJODIE CHAT - MODIFICHE COMPLETATE

### 1.1 FAB (Floating Action Button)
- **Tooltip**: Cambiato da "Open Jjodie" a "Ask Jjodie"
- **Hover**: Icona rimane bianca su hover (aggiunto `!important`)
- **Files modificati**:
  - `frontend/src/components/Jodie/JodieMinimized.tsx` - tooltip
  - `frontend/src/components/Jodie/JodieWindow.css` - hover icon color

```css
.jodie-minimized:hover i {
    color: #ffffff !important;  /* Ensure icon stays white on hover */
}
```

---

## 2. ERROR MODAL - AGGIUNTO CLASSNAME

### 2.1 Obiettivo
Mostrare il className dell'oggetto dove l'errore si è verificato (es. "DAttribute").

### 2.2 Prima
```
Instance: attr_1    Node: GE
```

### 2.3 Dopo
```
Instance: attr_1    Class: DAttribute    Node: GE
```

### 2.4 Files Modificati
- `frontend/src/common/ErrorPortal.tsx` - aggiunto prop `dataClassName`
- `frontend/src/common/DV.tsx` - passa `data?.className` a ErrorDisplay
- `frontend/src/common/error.scss` - stile per `.error-class-name`

### 2.5 Codice Chiave
```tsx
// ErrorPortal.tsx
{dataClassName && <span className='error-class-name'><strong>Class:</strong> {dataClassName}</span>}

// DV.tsx
<ErrorDisplay
    ...
    dataClassName={data?.className}
/>
```

---

## 3. STYLING CLASSI E ATTRIBUTI - CANVAS

### 3.1 Obiettivo
```
┌─────────────────────────────────────┐
│ Class:              Concept_0       │  ← nome classe a destra, monospace
├─────────────────────────────────────┤
│ attr_0:    [EString     ▼]          │  ← font più grande, select più stretta
│ attr_1:    [Integer     ▼]          │
└─────────────────────────────────────┘
```

### 3.2 Modifiche in `frontend/src/styles/diagram.scss`

#### Header Classe (linee 68-107)
```scss
.class > .header {
    display: flex;
    align-items: center;
    justify-content: space-between;  // Nome a destra
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;

    & input {
        font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
        font-size: 13px;
        font-weight: 600;
        text-align: right;
    }
}

.class-name {
    font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
    margin-left: auto;
    text-align: right;
}
```

#### Righe Attributi/Reference (linee 163-256)
```scss
.attribute, .reference {
    font-size: 13px;  // Aumentato da 10px
    gap: 8px;
    padding: 6px 0;

    .feature-name {
        font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
        font-size: 13px;
        min-width: 80px;
    }

    // Select più stretta
    select, .css-b62m3t-container {
        min-width: 90px;
        max-width: 140px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
    }
}
```

#### Root Feature Container (linee 258-281)
```scss
.root.feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    .css-b62m3t-container {
        max-width: 140px;
    }
}
```

#### Base Typography (linee 13-30)
```scss
.Vertex, .class, .attribute, .reference, ... {
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;  // Aumentato da 10px
}
```

---

## 4. MONACO EDITOR - MINIMUM HEIGHT

### 4.1 Problema
Monaco editors collassavano a dimensioni minuscole quando usavano percentuali.

### 4.2 Soluzione
Aggiunto minHeight in `frontend/src/styles/components/_form-system.scss`:

```scss
.monaco-editor-wrapper {
    min-height: 150px !important;
}

.template-tab .monaco-editor-wrapper {
    min-height: 200px !important;
}

.function-editor-root .monaco-editor-wrapper {
    min-height: 120px !important;
}
```

### 4.3 Jsx.tsx
Cambiato da percentuali a viewport height:
```tsx
style={{
    height: expand ? '60vh' : '40vh',
    minHeight: '200px',
    maxHeight: expand ? '800px' : '500px',
}}
```

---

## 5. TOGGLE CENTRALIZZATI

### 5.1 Obiettivo
Definizione unica per tutti i toggle nel sistema.

### 5.2 File: `_form-system.scss`
```scss
.toggle,
.form-toggle,
.toggle-switch {
    // Definizione unica
}
```

### 5.3 Files Puliti
- Rimosso duplicati da `info-improvements.scss`
- Rimosso duplicati da `forms.scss`

---

## 6. OVERVIEW CARDS - GRIGLIA 1x3

### 6.1 Layout
```
┌─────────────┬─────────────┬─────────────┐
│  📁 12      │  📊 5       │  📋 3       │
│  Packages   │  Classes    │ Enumerators │
└─────────────┴─────────────┴─────────────┘
```

### 6.2 CSS Trick per Dividers
```scss
.overview-grid-horizontal {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    background: #e2e8f0;  // Colore divider
    gap: 1px;             // Spessore divider
    border-radius: 12px;
    overflow: hidden;
}

.overview-cell {
    background: #f1f5f9;  // Colore celle
}
```

---

## 7. DRAG & DROP FEATURES (da sessione precedente)

### 7.1 View Class - Handler Drop
```typescript
onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    try {
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        const dropData = JSON.parse(dataStr);
        switch (dropData.type) {
            case 'FEATURE_ATTRIBUTE':
                data.addAttribute('newAttribute');
                break;
            case 'FEATURE_REFERENCE':
                data.addReference('newReference');
                break;
            case 'FEATURE_OPERATION':
                data.addOperation('newOperation');
                break;
        }
    } catch (err) {
        console.error('Drop on class failed:', err);
    }
}}
```

### 7.2 CSS Drag-Over
```scss
.class.drag-over,
.enumerator.drag-over {
    outline: 2px dashed #3b82f6;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
```

---

## 8. FILES MODIFICATI IN QUESTA SESSIONE

| File | Modifica |
|------|----------|
| `components/Jodie/JodieMinimized.tsx` | Tooltip "Ask Jjodie" |
| `components/Jodie/JodieWindow.css` | Hover icon white |
| `common/ErrorPortal.tsx` | Aggiunto dataClassName |
| `common/DV.tsx` | Passa data?.className |
| `common/error.scss` | Stile .error-class-name |
| `styles/diagram.scss` | Styling classi/attributi |
| `styles/components/_form-system.scss` | Monaco min-height |
| `components/editors/languages/Jsx.tsx` | minHeight 200px |
| `components/editors/Info.tsx` | Overview grid 1x3 |
| `components/editors/info-improvements.scss` | Grid CSS |

---

## 9. NOTE TECNICHE

### 9.1 Font Stack Consigliato
```scss
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

### 9.2 React-Select Class Names
- `.css-b62m3t-container` - container
- `.css-13cymwt-control` - control normale
- `.css-t3ipsp-control` - control focused
- `.css-1dimb5e-singleValue` - valore selezionato

### 9.3 Dark Mode
Ricordarsi sempre di aggiungere stili per:
- `@media (prefers-color-scheme: dark)`
- `[data-theme="dark"]`

---

## 10. TEST CHECKLIST

- [x] Jjodie FAB tooltip "Ask Jjodie"
- [x] Jjodie FAB icon white on hover
- [x] Error modal mostra className
- [x] Classe header: label sx, nome dx
- [x] Attributi: font 13px, select max 140px
- [x] Monaco editor min-height funziona
- [x] Overview grid 1x3 con dividers
- [ ] Dark mode styling verificato

---

*Ultimo aggiornamento: 2025-01-28*
