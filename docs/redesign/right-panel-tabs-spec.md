# JJODEL RIGHT PANEL TABS - SPECIFICATION

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. OVERVIEW

### Obiettivo
Ridisegnare i tab del Right Panel (dock system) usando lo stile **Segmented Control** (iOS/macOS style) per un look più moderno e "slick".

### Struttura Tab
Il Right Panel ha **2 livelli di tab**:

1. **Main Tabs** — navigazione principale del pannello
   - Properties, Tree View, Viewpoints, Node, Console

2. **Sub-Tabs** — navigazione secondaria (dentro Viewpoints)
   - Apply to, Template, Style, Events, Options, Permissions

### Design Reference
- iOS/macOS Segmented Control
- Stile B del mockup approvato

---

## 2. MAIN TABS (Livello 1)

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Properties │ Tree View │ Viewpoints │ Node │ Console               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [Contenuto del tab attivo]                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Specifiche Container

```scss
.main-tabs-container {
  display: flex;
  padding: 12px 16px;
  background: transparent;
}

.main-tabs {
  display: inline-flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
  gap: 2px;
}
```

### Specifiche Tab Item

```scss
.main-tab {
  padding: 8px 14px;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  
  &:hover:not(.active) {
    color: #374151;
    background: rgba(255, 255, 255, 0.5);
  }
  
  &.active {
    color: #111418;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
}
```

### Dimensioni

| Proprietà | Valore |
|-----------|--------|
| Container padding | `4px` |
| Container border-radius | `8px` |
| Container background | `#f1f5f9` |
| Tab padding | `8px 14px` |
| Tab border-radius | `6px` |
| Tab font-size | `13px` |
| Tab font-weight | `500` |
| Gap tra tab | `2px` |

### Colori

| Stato | Text Color | Background | Shadow |
|-------|------------|------------|--------|
| Default | `#6B7280` | `transparent` | none |
| Hover | `#374151` | `rgba(255,255,255,0.5)` | none |
| Active | `#111418` | `#ffffff` | `0 1px 3px rgba(0,0,0,0.1)` |

---

## 3. SUB-TABS (Livello 2)

### Quando Appaiono
I sub-tab appaiono solo quando il tab **Viewpoints** è attivo e l'utente ha navigato in un viewpoint specifico.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Main Tabs: ... Viewpoints ...]                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ ← Default › Model › Class                        (breadcrumb)           │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────┐       │
│ │ Apply to │ Template │ Style │ Events │ Options │ Permissions │       │
│ └───────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  [Contenuto del sub-tab attivo]                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Specifiche Container

```scss
.sub-tabs-container {
  padding: 0 16px 12px;
}

.sub-tabs {
  display: inline-flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 6px;
  gap: 2px;
}
```

### Specifiche Tab Item

```scss
.sub-tab {
  padding: 5px 10px;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  
  &:hover:not(.active) {
    color: #374151;
    background: rgba(255, 255, 255, 0.5);
  }
  
  &.active {
    color: #111418;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
}
```

### Dimensioni (più piccole dei Main Tabs)

| Proprietà | Main Tabs | Sub-Tabs |
|-----------|-----------|----------|
| Container padding | `4px` | `3px` |
| Container border-radius | `8px` | `6px` |
| Tab padding | `8px 14px` | `5px 10px` |
| Tab border-radius | `6px` | `4px` |
| Tab font-size | `13px` | `12px` |
| Shadow (active) | `0 1px 3px` | `0 1px 2px` |

---

## 4. BREADCRUMB (Navigazione Viewpoints)

### Layout

```
← Default › Model › Package › Class
```

### Specifiche

```scss
.viewpoint-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 13px;
  color: #6B7280;
}

.breadcrumb-back {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  color: #6B7280;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #e2e4e8;
    color: #374151;
  }
}

.breadcrumb-item {
  color: #06B6D4;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  color: #D1D5DB;
  font-size: 12px;
}

.breadcrumb-current {
  color: #111418;
  font-weight: 500;
}
```

---

## 5. ANIMAZIONI

### Tab Switch Animation

```scss
// Transizione smooth per cambio tab
.main-tab, .sub-tab {
  transition: all 150ms ease;
}

// Opzionale: sliding indicator
// Se si vuole un indicatore che "scorre" sotto il tab attivo
.tabs-indicator {
  position: absolute;
  bottom: 0;
  height: 100%;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
}
```

### Content Transition (opzionale)

```scss
.tab-content {
  animation: fadeIn 150ms ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 6. RESPONSIVE BEHAVIOR

### Quando lo Spazio è Limitato

Se il pannello è troppo stretto:

1. **Opzione A: Scroll orizzontale**
```scss
.main-tabs {
  overflow-x: auto;
  scrollbar-width: none; // nasconde scrollbar
  
  &::-webkit-scrollbar {
    display: none;
  }
}
```

2. **Opzione B: Dropdown overflow**
I tab che non entrano vanno in un menu "..." (more)

**Raccomandazione:** Opzione A (scroll) per semplicità

---

## 7. ACCESSIBILITY

### Keyboard Navigation

- `Tab` / `Shift+Tab` — entra/esce dal gruppo tab
- `Arrow Left` / `Arrow Right` — naviga tra tab
- `Enter` / `Space` — attiva tab selezionato
- `Home` — primo tab
- `End` — ultimo tab

### ARIA Attributes

```tsx
<div role="tablist" aria-label="Panel navigation">
  <button 
    role="tab" 
    aria-selected={isActive}
    aria-controls={`panel-${tabId}`}
    tabIndex={isActive ? 0 : -1}
  >
    {tabLabel}
  </button>
</div>

<div 
  role="tabpanel" 
  id={`panel-${tabId}`}
  aria-labelledby={`tab-${tabId}`}
>
  {content}
</div>
```

### Focus Visible

```scss
.main-tab:focus-visible,
.sub-tab:focus-visible {
  outline: 2px solid #06B6D4;
  outline-offset: 2px;
}
```

---

## 8. COMPONENT STRUCTURE (React)

### File Structure

```
/frontend/src/components/
├── dock/
│   ├── DockTabs.tsx           ← Main tabs component
│   ├── DockSubTabs.tsx        ← Sub-tabs component
│   ├── DockBreadcrumb.tsx     ← Breadcrumb navigation
│   ├── dock-tabs.scss         ← Stili per i tab
│   └── index.ts
```

### DockTabs Component

```tsx
// components/dock/DockTabs.tsx

import React from 'react';
import './dock-tabs.scss';

interface Tab {
  id: string;
  label: string;
}

interface DockTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  size?: 'main' | 'sub';
}

export const DockTabs: React.FC<DockTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  size = 'main'
}) => {
  return (
    <div className={`dock-tabs-container dock-tabs-${size}`}>
      <div 
        className="dock-tabs" 
        role="tablist"
        aria-label={size === 'main' ? 'Panel navigation' : 'Section navigation'}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            className={`dock-tab ${activeTab === tab.id ? 'active' : ''}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Usage Example

```tsx
// Nel Right Panel
const mainTabs = [
  { id: 'properties', label: 'Properties' },
  { id: 'treeview', label: 'Tree View' },
  { id: 'viewpoints', label: 'Viewpoints' },
  { id: 'node', label: 'Node' },
  { id: 'console', label: 'Console' },
];

const subTabs = [
  { id: 'applyto', label: 'Apply to' },
  { id: 'template', label: 'Template' },
  { id: 'style', label: 'Style' },
  { id: 'events', label: 'Events' },
  { id: 'options', label: 'Options' },
  { id: 'permissions', label: 'Permissions' },
];

<DockTabs 
  tabs={mainTabs} 
  activeTab={activeMainTab} 
  onTabChange={setActiveMainTab}
  size="main"
/>

{activeMainTab === 'viewpoints' && (
  <>
    <DockBreadcrumb path={viewpointPath} onNavigate={handleNavigate} />
    <DockTabs 
      tabs={subTabs} 
      activeTab={activeSubTab} 
      onTabChange={setActiveSubTab}
      size="sub"
    />
  </>
)}
```

---

## 9. COMPLETE SCSS

```scss
// components/dock/dock-tabs.scss

// ============================================
// VARIABLES
// ============================================
$tabs-bg: #f1f5f9;
$tab-active-bg: #ffffff;
$tab-text: #6B7280;
$tab-text-hover: #374151;
$tab-text-active: #111418;
$tab-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
$tab-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.08);
$accent: #06B6D4;
$transition: 150ms ease;

// ============================================
// MAIN TABS (Livello 1)
// ============================================
.dock-tabs-main {
  padding: 12px 16px;
  
  .dock-tabs {
    display: inline-flex;
    background: $tabs-bg;
    padding: 4px;
    border-radius: 8px;
    gap: 2px;
  }
  
  .dock-tab {
    padding: 8px 14px;
    font-family: 'Inter Variable', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: $tab-text;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all $transition;
    white-space: nowrap;
    
    &:hover:not(.active) {
      color: $tab-text-hover;
      background: rgba(255, 255, 255, 0.5);
    }
    
    &.active {
      color: $tab-text-active;
      background: $tab-active-bg;
      box-shadow: $tab-shadow;
    }
    
    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: 2px;
    }
  }
}

// ============================================
// SUB TABS (Livello 2)
// ============================================
.dock-tabs-sub {
  padding: 0 16px 12px;
  
  .dock-tabs {
    display: inline-flex;
    background: $tabs-bg;
    padding: 3px;
    border-radius: 6px;
    gap: 2px;
  }
  
  .dock-tab {
    padding: 5px 10px;
    font-family: 'Inter Variable', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: $tab-text;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all $transition;
    white-space: nowrap;
    
    &:hover:not(.active) {
      color: $tab-text-hover;
      background: rgba(255, 255, 255, 0.5);
    }
    
    &.active {
      color: $tab-text-active;
      background: $tab-active-bg;
      box-shadow: $tab-shadow-sm;
    }
    
    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: 2px;
    }
  }
}

// ============================================
// BREADCRUMB
// ============================================
.viewpoint-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-family: 'Inter Variable', -apple-system, sans-serif;
  font-size: 13px;
  color: $tab-text;
}

.breadcrumb-back {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $tabs-bg;
  border: none;
  border-radius: 6px;
  color: $tab-text;
  cursor: pointer;
  transition: all $transition;
  
  &:hover {
    background: darken($tabs-bg, 5%);
    color: $tab-text-hover;
  }
  
  // Icona: bi-arrow-left o bi-chevron-left
  i {
    font-size: 14px;
  }
}

.breadcrumb-item {
  color: $accent;
  cursor: pointer;
  transition: all $transition;
  
  &:hover {
    text-decoration: underline;
  }
}

.breadcrumb-separator {
  color: #D1D5DB;
  font-size: 12px;
}

.breadcrumb-current {
  color: $tab-text-active;
  font-weight: 500;
}

// ============================================
// RESPONSIVE - Scroll orizzontale
// ============================================
.dock-tabs {
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

// ============================================
// CONTENT ANIMATION (opzionale)
// ============================================
.dock-tab-content {
  animation: tabFadeIn 150ms ease;
}

@keyframes tabFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 10. IMPLEMENTATION CHECKLIST

### Phase 1: Struttura Base
- [ ] Creare `DockTabs.tsx` component
- [ ] Creare `dock-tabs.scss` con stili segmented
- [ ] Sostituire tab esistenti nel Right Panel

### Phase 2: Sub-Tabs
- [ ] Creare `DockSubTabs.tsx` (o riusare DockTabs con size="sub")
- [ ] Implementare nel tab Viewpoints
- [ ] Creare `DockBreadcrumb.tsx`

### Phase 3: Polish
- [ ] Aggiungere animazioni fade
- [ ] Testare keyboard navigation
- [ ] Aggiungere ARIA attributes
- [ ] Verificare responsive (scroll su pannello stretto)

### Phase 4: Cleanup
- [ ] Rimuovere vecchi stili tab
- [ ] Aggiornare documentazione

---

## 11. VISUAL COMPARISON

### Prima (Current)

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │Properties│ │Tree View │ │Viewpoints│ ...         │
│ └──────────┘ └──────────┘ └──────────┘             │
│      ↑ Tab con bordo cyan, sfondo bianco           │
└─────────────────────────────────────────────────────┘
```

### Dopo (Segmented Control)

```
┌─────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │ Properties │ Tree View │▓Viewpoints▓│ Node │... │ │
│ └─────────────────────────────────────────────────┘ │
│      ↑ Container grigio, tab attivo bianco con     │
│        shadow, tutto arrotondato                   │
└─────────────────────────────────────────────────────┘
```

---

**END OF SPECIFICATION**

*Pass this document to Claude in VS Code for implementation.*
