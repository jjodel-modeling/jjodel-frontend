# Handover: UI Refinements - Toggles, Viewpoints, Events
**Data**: 26 Gennaio 2026
**Branch**: alfonso-frontend-dev

## Overview

Sessione focalizzata su refinement UI di componenti esistenti:
- Navbar toggles (Debug/Mode) con nuovo VerticalToggle component
- Viewpoints panel (priority styling)
- Events tab redesign
- Form focus states standardization
- JjodieWidget positioning

---

## 1. Vertical Toggle Component

### Nuovo Componente UI
Creato un toggle verticale minimal per la Navbar, usato per Debug e Mode switching.

### Files Creati/Modificati

**Nuovo componente:**
- `frontend/src/components/ui/VerticalToggle.tsx`
- `frontend/src/components/ui/VerticalToggle.scss`

**Integrazione Navbar:**
- `frontend/src/pages/components/Navbar.tsx` (linee 1377-1395)
- `frontend/src/pages/components/navbar.scss` (linee 1053-1202)

### Specifiche Design

```scss
// Toggle switch dimensions
.toggle-switch {
  width: 12px;
  height: 28px;
  border-radius: 7px;
}

// Thumb (pallino)
.toggle-switch-thumb {
  width: 9px;
  height: 9px;
}

// Labels
.toggle-label {
  font-size: 11px;
  font-weight: 500;
  min-width: 65px; // Previene shift
}
```

### Stati Toggle

| Stato | Background | Border | Thumb Position | Thumb Color |
|-------|-----------|--------|----------------|-------------|
| OFF | transparent | #475569 | BASSO | #475569 |
| ON | #475569 | #475569 | ALTO | #ffffff |

### Label Colors

| Stato | Colore |
|-------|--------|
| Attivo | #1e293b (slate-900) |
| Inattivo | #9ca3af (gray-400) |

### Props Interface

```typescript
interface VerticalToggleProps {
  isActive: boolean;
  onToggle: () => void;
  labelOn: string;
  labelOff: string;
  className?: string;
  variant?: 'default' | 'debug';
  showLabels?: boolean;
}
```

### Uso in Navbar

```tsx
<div className="navbar-toggles">
  <VerticalToggle
    isActive={props.debug}
    onToggle={() => { /* toggle debug */ }}
    labelOn="debug on"
    labelOff="debug off"
    variant="debug"
  />
  <VerticalToggle
    isActive={props.advanced}
    onToggle={toggleAdvancedMode}
    labelOn="advanced"
    labelOff="basic"
    variant="default"
  />
</div>
```

---

## 2. Viewpoints Panel - Priority Styling

### Miglioramenti

1. **Priority Label** - Più visibile
   - Font size: 10px → 11px
   - Font weight: 500 (aggiunto)
   - Color: #94a3b8 → #64748b (slate-500)
   - Font family: Inter Variable

2. **Priority Input** - Dimensioni standardizzate
   - Width: 40px
   - Height: 22px
   - Font size: 11px
   - Spinner nascosto

### Files Modificati

- `frontend/src/components/editors/views/nestedView.scss`
  - `.view-entry__priority .priority` (linee ~1379-1392)
  - `.view-entry__priority .priority-booster` (linee ~1407-1431)
  - `.right-content .priority` e `.priority-booster` (linee ~1744-1780)

### Codice Finale

```scss
.priority {
  min-width: 50px;
  height: 22px;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  color: #64748b; // slate-500
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.priority-booster {
  width: 40px;
  height: 22px;
  font-size: 11px;
  font-family: 'SF Mono', 'Monaco', monospace;

  // Hide spinner
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
}
```

---

## 3. Events Tab Redesign

### Miglioramenti

Redesign completo del tab Events per le View/Viewpoints.

### Files Modificati

- `frontend/src/components/editors/views/data/CustomData.tsx` - Struttura JSX
- `frontend/src/components/editors/views/data/events-tab.scss` - Styling

### Nuova Struttura

```
Events Tab
├── Default Events Section
│   ├── Header (icon + title + badge "System")
│   └── Events List
│       ├── onDataUpdate
│       ├── onDragStart
│       ├── whileDragging
│       ├── onDragEnd
│       ├── onResizeStart
│       ├── whileResizing
│       └── onResizeEnd
├── Separator
└── Custom Events Section
    ├── Header (icon + title + add button)
    └── Events List / Empty State
```

### Styling Key

```scss
.events-section {
  &--default .editor-toolbar {
    background: transparent;
    border-color: transparent;
  }

  &--custom .editor-toolbar {
    background: #ffffff;
    border-color: #e2e8f0;
  }
}

.events-add-btn {
  // Circular add button
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
}

.events-empty-state {
  // Centered empty state with icon
  text-align: center;
  padding: 24px;
}
```

---

## 4. Form Focus States Standardization

### Problema Risolto

Focus states inconsistenti tra i vari form elements (input, select, textarea).

### Soluzione

Centralizzazione in CSS variables:

```scss
:root {
  --form-input-border-color-focus: #334155; // slate-700
  --form-input-focus-shadow: 0 0 0 3px rgba(51, 65, 85, 0.15);
}

[data-theme="dark"] {
  --form-input-border-color-focus: #64748b; // slate-500 (lighter for visibility)
  --form-input-focus-shadow: 0 0 0 3px rgba(100, 116, 139, 0.25);
}
```

### Files Modificati

- `frontend/src/styles/components/_form-system.scss`

---

## 5. JjodieWidget Positioning

### Fix

Assicurato posizionamento fisso bottom-right per il FAB (Floating Action Button).

### Files Modificati

- `frontend/src/components/JjodieWidget/jjodie-widget.scss`

### Stili Chiave

```scss
.jjodie-fab {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  left: auto !important; // Prevent left positioning override
  width: 56px !important;
  height: 56px !important;
  border-radius: 50%;
  background: var(--gradient-primary);
}
```

---

## Design Patterns Stabiliti

### 1. Toggle Switch Verticale
- Dimensioni: 12x28px
- Pallino: 9px
- Border sempre presente (no layout shift)
- Labels con width fissa

### 2. Form Focus States
- Colore: Slate palette
- Shadow: 3px ring con opacity
- Transizione smooth (150ms)

### 3. Section Headers (Events)
- Icon + Title + Badge/Action
- Padding consistente
- Separator tra sezioni

---

## Testing Checklist

- [x] Toggle switch funziona (click e keyboard)
- [x] Toggle labels non shiftano al cambio stato
- [x] Priority input accetta solo numeri
- [x] Spinner nascosto su priority input
- [x] Events tab mostra correttamente default e custom
- [x] Add event button funziona
- [x] Focus ring visibile su tutti i form elements
- [x] Dark mode supportato

---

## Prossimi Step Suggeriti

1. [ ] Aggiungere tooltip ai toggle nella navbar
2. [ ] Considerare animazione smooth per toggle switch
3. [ ] Testare accessibility con screen reader
4. [ ] Aggiungere keyboard shortcuts per toggle (es. Ctrl+D per debug)

---

## Correlazione con Task Precedenti

- Continua il redesign Viewpoints (2026-01-24-viewpoints-redesign.md)
- Segue breadcrumb badge (2026-01-25-breadcrumb-badge.md)
- Segue Monaco editors fullscreen (2026-01-25-monaco-editors-fullscreen.md)
