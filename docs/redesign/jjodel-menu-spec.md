# JJODEL MENU REDESIGN - SPECIFICATION

**Version:** 2.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. OVERVIEW

### Obiettivo
Sostituire i tab di navigazione (`Projects | Templates | Explore`) con un menu principale a dropdown (`Jjodel | File | Edit | View | Tools | Analyze`) più un menu Help separato e una Bottom Toolbar per comandi rapidi.

### Cambiamenti principali
1. **Header**: nuovo menu dropdown al posto dei tab
2. **Menu Tools**: nuovo menu dinamico per comandi metamodel-specific (S4+)
3. **Bottom Toolbar**: toolbar orizzontale sopra il footer con Tools commands + Canvas controls
4. **Sidebar**: aggiunta di `Templates` e `Explore`
5. **Stile dropdown**: light theme (sfondo bianco)
6. **Shortcuts**: visibili con detection piattaforma
7. **Sign out**: rimosso da menu Jjodel, resta solo in Avatar menu

---

## 2. HEADER STRUCTURE

### Layout

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  [Jjodel ▾] [File ▾] [Edit ▾] [View ▾] [Tools ▾] [Analyze ▾]  [?Help] [OU▾] │
│ 48px    Menu items con dropdown                                       Help  Avatar │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Specifiche Header
- **Altezza:** 60px
- **Background:** `#ffffff`
- **Border-bottom:** `1px solid #e2e4e8`
- **Padding:** `0 24px`

### Logo
- **Testo:** "Jjodel."
- **Font:** Inter Variable, 20px, weight 700
- **Colore:** `#374151`
- **Margin-right:** 32px
- **Comportamento:** click → torna alla dashboard (route: `/`)

### Menu Items (Jjodel, File, Edit, View, Analyze)
- **Font:** Inter Variable, 14px, weight 500
- **Colore default:** `#374151`
- **Colore hover:** `#111418`
- **Colore disabled:** `#9CA3AF`
- **Background hover:** `#f1f5f9`
- **Padding:** `8px 12px`
- **Border-radius:** `6px`
- **Gap tra items:** `4px`
- **Icona chevron:** `bi-chevron-down`, 10px, margin-left 4px

### Help Button (a destra)
- **Icona:** `bi-question-circle`
- **Testo:** "Help"
- **Stile:** come menu items
- **Posizione:** `margin-left: auto` (spinge a destra)

### Avatar
- **Size:** 36px
- **Border-radius:** 50%
- **Background:** `#06B6D4` (accent)
- **Colore testo:** `#ffffff`
- **Font:** 14px, weight 600
- **Margin-left:** 16px

---

## 3. DROPDOWN STYLE (Light Theme)

### Container
```scss
.menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 220px;
  background: #ffffff;
  border: 1px solid #e2e4e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 1000;
}
```

### Menu Item
```scss
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-family: 'Inter Variable', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover:not(.disabled) {
    background: #f1f5f9;
    color: #111418;
  }
  
  &.disabled {
    color: #9CA3AF;
    cursor: not-allowed;
  }
}
```

### Menu Item con Icona
```scss
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item-icon {
  width: 16px;
  height: 16px;
  font-size: 14px;
  color: #6B7280;
  
  .menu-item:hover:not(.disabled) & {
    color: #374151;
  }
  
  .menu-item.disabled & {
    color: #D1D5DB;
  }
}
```

### Shortcut Badge
```scss
.menu-shortcut {
  font-family: 'Inter Variable', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #9CA3AF;
  
  .menu-item.disabled & {
    color: #D1D5DB;
  }
}
```

### Separator
```scss
.menu-separator {
  height: 1px;
  background: #e2e4e8;
  margin: 6px 0;
}
```

### Submenu Indicator
```scss
.menu-submenu-arrow {
  font-size: 12px;
  color: #9CA3AF;
  // Icona: bi-chevron-right
}
```

### Submenu Container
```scss
.menu-submenu {
  position: absolute;
  left: calc(100% + 4px);
  top: -6px;
  // Stesso stile di .menu-dropdown
}
```

---

## 4. MENU STRUCTURE & ICONS

### Menu: Jjodel
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| About Jjodel | `bi-info-circle` | — | Apre modal About |
| Road Map | `bi-map` | — | Link esterno |

*Nota: Sign out è stato spostato nel menu Avatar*

### Menu: File
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| New | `bi-plus-lg` | → | Submenu |
| ↳ Project | `bi-folder-plus` | `⌘/Ctrl + N` | |
| ↳ Metamodel | `bi-diagram-3` | `⌘/Ctrl + Shift + M` | |
| ↳ Model | `bi-file-earmark-plus` | `⌘/Ctrl + Shift + O` | |
| Import Project | `bi-download` | `⌘/Ctrl + I` | |
| — | separator | | |
| Add to favorites | `bi-star` | `⌘/Ctrl + D` | Toggle |
| — | separator | | |
| Recent Projects | `bi-clock-history` | → | Submenu dinamico |

### Menu: Edit
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| Undo | `bi-arrow-counterclockwise` | `⌘/Ctrl + Z` | |
| Redo | `bi-arrow-clockwise` | `⌘/Ctrl + Shift + Z` | |

### Menu: View
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| Zoom in | `bi-zoom-in` | `⌘/Ctrl + =` | |
| Zoom out | `bi-zoom-out` | `⌘/Ctrl + -` | |
| — | separator | | |
| Save layout | `bi-layout-wtf` | — | |
| Load layout | `bi-layout-split` | — | |
| — | separator | | |
| Show/hide sidebar | `bi-layout-sidebar` | `⌘/Ctrl + B` | Toggle |
| Show/hide toolbar | `bi-window-dock` | `⌘/Ctrl + Shift + B` | Toggle |
| — | separator | | |
| Fullscreen Mode | `bi-fullscreen` | `F11` / `⌘+Ctrl+F` | Toggle |

### Menu: Tools (DINAMICO)
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| *(contenuto dinamico)* | — | — | Definito dal metamodello |

**Comportamento:**
- **Disabled** in S1, S2, S3 (nessun metamodello)
- **Enabled** da S4+ (almeno un metamodello presente)
- Il contenuto è popolato dinamicamente dal designer del metamodello
- Ogni metamodello può registrare comandi custom con icona, label, shortcut e azione
- Se nessun comando è definito, il menu mostra "No tools available"
- Gli stessi comandi appaiono anche nella Bottom Toolbar

**Esempio contenuto (metamodello UML):**
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| Validate Model | `bi-check-circle` | `⌘/Ctrl + Shift + V` | |
| Generate Code | `bi-code-slash` | — | |
| — | separator | | |
| Auto Layout | `bi-grid-3x3` | `⌘/Ctrl + L` | |

### Menu: Analyze
| Voce | Icona | Shortcut | Note |
|------|-------|----------|------|
| Debug loops | `bi-bug` | — | |
| Check & Repair | `bi-wrench` | — | |

### Menu: Help
| Voce | Icona | Note |
|------|-------|------|
| What's New in Jjodel | `bi-bell` | |
| Homepage | `bi-house` | Link esterno |
| — | separator | |
| Learn Jjodel | `bi-infinity` | |
| Getting Started | `bi-rocket-takeoff` | |
| Video Tutorials | `bi-play-circle` | |
| User Guide | `bi-journal-text` | |
| Glossary | `bi-book` | |
| FAQ | `bi-chat-square-question` | |
| — | separator | |
| Support | `bi-life-preserver` | → Submenu |
| ↳ Report a Bug | `bi-bug` | |
| ↳ Request a Feature | `bi-hand-index` | |
| ↳ Contact | `bi-envelope` | |

### Menu: Avatar (cliccando sull'avatar)
| Voce | Icona | Note |
|------|-------|------|
| *[Nome Utente]* | — | Header, non cliccabile |
| *[Affiliazione]* | — | Subtitle, non cliccabile |
| — | separator | |
| Dashboard | `bi-grid` | Torna alla dashboard |
| Profile | `bi-person` | Apre profilo utente |
| Account | `bi-person-gear` | Disabled (futuro) |
| — | separator | |
| Theme | `bi-circle-half` | → Submenu |
| ↳ Light | `bi-sun` | Radio, checkmark se attivo |
| ↳ Dark | `bi-moon` | Radio, checkmark se attivo |
| — | separator | |
| Sign out | `bi-box-arrow-right` | Logout |

---

## 4B. BOTTOM TOOLBAR

### Overview
Toolbar orizzontale posizionata sopra il footer, visibile solo quando l'editor è aperto (S6, S7).

### Layout
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [🔧 Cmd1] [⚙ Cmd2] [📦 Cmd3]  │  Grid [✓]  Snap [✓]  │  [−]  100%  [+]       │
│ ← Tools commands (dinamici)    │  ← Canvas toggles     │  ← Zoom controls      │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Specifiche
- **Altezza:** 40px
- **Background:** `#ffffff`
- **Border-top:** `1px solid #e2e4e8`
- **Padding:** `0 16px`
- **Visibilità:** Solo in S6 e S7 (editor aperto)

### Sezioni

#### Tools Commands (sinistra)
- Contenuto dinamico dal metamodello
- Stesso contenuto del menu Tools ▾
- Bottoni con icona + label (opzionale, solo icona se spazio limitato)
- Tooltip con nome comando e shortcut

```scss
.toolbar-tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  background: transparent;
  border: 1px solid #e2e4e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #f1f5f9;
    border-color: #d0d3d8;
  }
  
  .icon {
    font-size: 14px;
    color: #6B7280;
  }
}
```

#### Canvas Toggles (centro)
| Controllo | Icona ON | Icona OFF | Default |
|-----------|----------|-----------|---------|
| Grid | `bi-grid-3x3-gap` | `bi-grid-3x3-gap` (dimmed) | OFF |
| Snap | `bi-magnet` | `bi-magnet` (dimmed) | OFF |

```scss
.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #6B7280;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  
  &.active {
    color: #06B6D4;
    background: #ecfeff;
  }
  
  &:hover:not(.active) {
    background: #f1f5f9;
  }
}
```

#### Zoom Controls (destra)
- Bottone `−` (zoom out)
- Display percentuale (es. "100%")
- Bottone `+` (zoom in)
- Click sulla percentuale → dropdown con preset (50%, 75%, 100%, 150%, 200%, Fit)

```scss
.toolbar-zoom {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .zoom-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #6B7280;
    background: transparent;
    border: 1px solid #e2e4e8;
    border-radius: 6px;
    cursor: pointer;
    
    &:hover {
      background: #f1f5f9;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .zoom-value {
    min-width: 50px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    
    &:hover {
      background: #f1f5f9;
    }
  }
}

---

## 5. KEYBOARD SHORTCUT DETECTION

### Utility Function
```typescript
// utils/platform.ts

export const isMac = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export const formatShortcut = (mac: string, win: string): string => {
  return isMac() ? mac : win;
};

// Simboli
// Mac: ⌘ (Command), ⌥ (Option), ⇧ (Shift), ⌃ (Control)
// Win: Ctrl, Alt, Shift
```

### Shortcut Map
```typescript
// constants/shortcuts.ts

export const SHORTCUTS = {
  'file.new.project': { mac: '⌘N', win: 'Ctrl+N' },
  'file.new.metamodel': { mac: '⇧⌘M', win: 'Ctrl+Shift+M' },
  'file.new.model': { mac: '⇧⌘O', win: 'Ctrl+Shift+O' },
  'file.import': { mac: '⌘I', win: 'Ctrl+I' },
  'file.favorites': { mac: '⌘D', win: 'Ctrl+D' },
  'edit.undo': { mac: '⌘Z', win: 'Ctrl+Z' },
  'edit.redo': { mac: '⇧⌘Z', win: 'Ctrl+Shift+Z' },
  'view.zoomIn': { mac: '⌘=', win: 'Ctrl+=' },
  'view.zoomOut': { mac: '⌘-', win: 'Ctrl+-' },
  'view.sidebar': { mac: '⌘B', win: 'Ctrl+B' },
  'view.toolbar': { mac: '⇧⌘B', win: 'Ctrl+Shift+B' },
  'view.fullscreen': { mac: '⌃⌘F', win: 'F11' },
};
```

---

## 6. STATE MANAGEMENT

### Menu State Interface
```typescript
// types/menu.ts

export type AppState = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';

export interface MenuItemState {
  enabled: boolean;
  visible: boolean;
  checked?: boolean; // per toggle items
}

export interface MenuState {
  [menuId: string]: {
    [itemId: string]: MenuItemState;
  };
}
```

### State Derivation Logic
```typescript
// hooks/useMenuState.ts

import { useSelector } from 'react-redux';

export const useMenuState = (): MenuState => {
  // Derive from Redux state
  const hasProjects = useSelector(state => state.projects.list.length > 0);
  const projectOpen = useSelector(state => state.project.current !== null);
  const hasMetamodels = useSelector(state => state.project.metamodels.length > 0);
  const hasModels = useSelector(state => state.project.models.length > 0);
  const editorOpen = useSelector(state => state.editor.active !== null);
  
  // Determine current state
  const appState = determineAppState({
    hasProjects,
    projectOpen,
    hasMetamodels,
    hasModels,
    editorOpen,
  });
  
  // Return enabled/disabled state for each menu item
  return buildMenuState(appState);
};

const determineAppState = (flags): AppState => {
  if (!flags.projectOpen && !flags.hasProjects) return 'S1';
  if (!flags.projectOpen && flags.hasProjects) return 'S2';
  if (flags.projectOpen && !flags.hasMetamodels) return 'S3';
  if (flags.projectOpen && flags.hasMetamodels && !flags.hasModels) return 'S4';
  if (flags.projectOpen && flags.hasMetamodels && flags.hasModels && !flags.editorOpen) return 'S5';
  if (flags.editorOpen && flags.editorType === 'metamodel') return 'S6';
  if (flags.editorOpen && flags.editorType === 'model') return 'S7';
  return 'S1';
};
```

### Enable/Disable Matrix (from menu-matrix.txt)

**Stati del sistema (S0-S7):**
- S0: Logged out (nessun menu)
- S1: Dashboard vuota (0 progetti)
- S2: Dashboard con progetti (≥1 progetto)
- S3: Progetto aperto, vuoto (0 metamodels)
- S4: Progetto aperto, con metamodel(s), 0 models
- S5: Progetto aperto, con metamodel(s) e model(s)
- S6: Progetto aperto, con metamodel Editor aperto
- S7: Progetto aperto, con model aperto

```typescript
// constants/menuMatrix.ts

export type AppState = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';

export const MENU_MATRIX: Record<string, Record<AppState, boolean>> = {
  'file.new.project':     { S1: true,  S2: true,  S3: false, S4: false, S5: false, S6: false, S7: false },
  'file.new.metamodel':   { S1: false, S2: false, S3: true,  S4: true,  S5: true,  S6: true,  S7: true  },
  'file.new.model':       { S1: false, S2: false, S3: false, S4: true,  S5: true,  S6: true,  S7: true  },
  'file.import':          { S1: true,  S2: true,  S3: false, S4: false, S5: false, S6: false, S7: false },
  'file.favorites':       { S1: false, S2: false, S3: true,  S4: true,  S5: true,  S6: true,  S7: true  },
  'file.recent':          { S1: true,  S2: false, S3: false, S4: false, S5: false, S6: false, S7: false },
  'edit.undo':            { S1: false, S2: false, S3: true,  S4: true,  S5: true,  S6: true,  S7: true  },
  'edit.redo':            { S1: false, S2: false, S3: true,  S4: true,  S5: true,  S6: true,  S7: true  },
  'view.zoomIn':          { S1: false, S2: false, S3: false, S4: false, S5: false, S6: true,  S7: true  },
  'view.zoomOut':         { S1: false, S2: false, S3: false, S4: false, S5: false, S6: true,  S7: true  },
  'view.sidebar':         { S1: false, S2: false, S3: false, S4: false, S5: false, S6: false, S7: false },
  'view.toolbar':         { S1: false, S2: false, S3: false, S4: false, S5: false, S6: false, S7: false },
  'tools':                { S1: false, S2: false, S3: false, S4: true,  S5: true,  S6: true,  S7: true  },
  'analyze.debug':        { S1: false, S2: false, S3: false, S4: true,  S5: true,  S6: true,  S7: true  },
  'analyze.checkRepair':  { S1: false, S2: false, S3: false, S4: true,  S5: true,  S6: true,  S7: true  },
};

// Bottom Toolbar visibility
export const BOTTOM_TOOLBAR_VISIBLE: Record<AppState, boolean> = {
  S1: false, S2: false, S3: false, S4: false, S5: false, S6: true, S7: true
};
```

---

## 7. SIDEBAR UPDATES

### New Structure
```
┌─────────────────────┐
│ WORKSPACE           │  ← Section label (opzionale)
│ ○ All projects      │
│ ☆ Favorites         │
│ ⊗ Trash             │
│ ─────────────────── │
│ BROWSE              │  ← Section label (opzionale)
│ ◫ Templates         │  ← NUOVO
│ ⌘ Explore           │  ← NUOVO
│ ─────────────────── │
│ RECENTLY MODIFIED   │
│ └ Project 1         │
│ ─────────────────── │
│ SUPPORT             │
│ ⊞ Documentation     │
│ ▷ Tutorials         │
│ ─────────────────── │
│ Jjodel v2.0         │
└─────────────────────┘
```

### Icons for New Items
| Voce | Icona |
|------|-------|
| Templates | `bi-grid-3x3-gap` |
| Explore | `bi-compass` |

### Sidebar Item Styling (esistente, per riferimento)
```scss
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  font-size: 14px;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #f1f5f9;
  }
  
  &.active {
    background: #e0f2fe;
    color: #0891b2;
    font-weight: 500;
  }
}

.sidebar-icon {
  font-size: 16px;
  color: #6B7280;
  
  .sidebar-item.active & {
    color: #0891b2;
  }
}
```

---

## 8. COMPONENT STRUCTURE (React)

### File Structure
```
/frontend/src/
├── components/
│   └── menu/
│       ├── MainMenu.tsx          ← Container principale
│       ├── MenuBar.tsx           ← Barra con i menu items
│       ├── MenuItem.tsx          ← Singolo item nella barra
│       ├── MenuDropdown.tsx      ← Dropdown container
│       ├── MenuDropdownItem.tsx  ← Item nel dropdown
│       ├── MenuSeparator.tsx     ← Separatore
│       ├── MenuSubmenu.tsx       ← Submenu container
│       ├── menu.scss             ← Tutti gli stili
│       └── index.ts              ← Exports
├── constants/
│   ├── menuConfig.ts             ← Configurazione menu (voci, icone, shortcuts)
│   ├── menuMatrix.ts             ← Matrice enable/disable
│   └── shortcuts.ts              ← Definizione shortcuts
├── hooks/
│   └── useMenuState.ts           ← Hook per stato menu
└── utils/
    └── platform.ts               ← Utility detect OS
```

### MainMenu Component
```tsx
// components/menu/MainMenu.tsx

import React from 'react';
import { MenuBar } from './MenuBar';
import { useMenuState } from '../../hooks/useMenuState';
import { MENU_CONFIG } from '../../constants/menuConfig';
import './menu.scss';

export const MainMenu: React.FC = () => {
  const menuState = useMenuState();
  
  return (
    <nav className="main-menu">
      <MenuBar 
        menus={MENU_CONFIG.main} 
        state={menuState} 
      />
      <div className="main-menu-right">
        <MenuBar 
          menus={MENU_CONFIG.help} 
          state={menuState} 
        />
        <Avatar />
      </div>
    </nav>
  );
};
```

### Menu Config Example
```typescript
// constants/menuConfig.ts

export const MENU_CONFIG = {
  main: [
    {
      id: 'jjodel',
      label: 'Jjodel',
      items: [
        { id: 'about', label: 'About Jjodel', icon: 'bi-info-circle', action: 'openAbout' },
        { id: 'roadmap', label: 'Road Map', icon: 'bi-map', action: 'openRoadmap' },
        { type: 'separator' },
        { id: 'signout', label: 'Sign out', icon: 'bi-box-arrow-right', action: 'signOut' },
      ],
    },
    {
      id: 'file',
      label: 'File',
      items: [
        {
          id: 'new',
          label: 'New',
          icon: 'bi-plus-lg',
          submenu: [
            { id: 'new.project', label: 'Project', icon: 'bi-folder-plus', shortcut: 'file.new.project', action: 'newProject' },
            { id: 'new.metamodel', label: 'Metamodel', icon: 'bi-diagram-3', shortcut: 'file.new.metamodel', action: 'newMetamodel' },
            { id: 'new.model', label: 'Model', icon: 'bi-file-earmark-plus', shortcut: 'file.new.model', action: 'newModel' },
          ],
        },
        { id: 'import', label: 'Import Project', icon: 'bi-download', shortcut: 'file.import', action: 'importProject' },
        { type: 'separator' },
        { id: 'favorites', label: 'Add to favorites', icon: 'bi-star', shortcut: 'file.favorites', action: 'toggleFavorite' },
        { type: 'separator' },
        {
          id: 'recent',
          label: 'Recent Projects',
          icon: 'bi-clock-history',
          submenu: 'dynamic:recentProjects', // Populated dynamically
        },
      ],
    },
    // ... Edit, View, Analyze
  ],
  help: [
    {
      id: 'help',
      label: 'Help',
      icon: 'bi-question-circle',
      items: [
        // ... voci help
      ],
    },
  ],
};
```

---

## 9. ACCESSIBILITY

### Keyboard Navigation
- `Tab` / `Shift+Tab` — naviga tra menu items
- `Enter` / `Space` — apre dropdown o attiva item
- `Escape` — chiude dropdown
- `Arrow Down` — prossimo item nel dropdown
- `Arrow Up` — item precedente
- `Arrow Right` — apre submenu
- `Arrow Left` — chiude submenu

### ARIA Attributes
```tsx
<nav role="menubar" aria-label="Main menu">
  <button 
    role="menuitem" 
    aria-haspopup="true" 
    aria-expanded={isOpen}
  >
    File
  </button>
  <div role="menu" aria-label="File menu">
    <button role="menuitem" aria-disabled={!enabled}>
      New Project
    </button>
  </div>
</nav>
```

### Focus Management
- Focus trap dentro dropdown aperto
- Return focus al trigger quando si chiude
- Visible focus ring (outline) su tutti gli elementi interattivi

---

## 10. IMPLEMENTATION CHECKLIST

### Phase 1: Core Structure
- [ ] Creare cartella `/components/menu/`
- [ ] Implementare `MenuBar.tsx`
- [ ] Implementare `MenuDropdown.tsx`
- [ ] Implementare `MenuDropdownItem.tsx`
- [ ] Creare `menu.scss` con tutti gli stili

### Phase 2: Configuration
- [ ] Creare `constants/menuConfig.ts`
- [ ] Creare `constants/menuMatrix.ts`
- [ ] Creare `constants/shortcuts.ts`
- [ ] Creare `utils/platform.ts`

### Phase 3: State Management
- [ ] Implementare `useMenuState.ts` hook
- [ ] Connettere a Redux state esistente
- [ ] Testare enable/disable per ogni stato

### Phase 4: Integration
- [ ] Sostituire nav tabs in `Navbar.tsx`
- [ ] Aggiornare stili in `navbar.scss`
- [ ] Aggiungere Templates/Explore a `LeftBar.tsx`

### Phase 5: Polish
- [ ] Keyboard navigation
- [ ] ARIA attributes
- [ ] Animazioni apertura/chiusura dropdown
- [ ] Hover states refinement
- [ ] Test cross-browser

### Phase 6: Cleanup
- [ ] Rimuovere vecchi tab components
- [ ] Aggiornare menu Help allo stile light
- [ ] Update CLAUDE.md con nuova struttura

---

## APPENDIX: Complete SCSS

```scss
// components/menu/menu.scss

// ============================================
// VARIABLES (use from design tokens)
// ============================================
$menu-font: 'Inter Variable', -apple-system, sans-serif;
$menu-bg: #ffffff;
$menu-border: #e2e4e8;
$menu-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
$menu-radius: 8px;
$menu-item-radius: 6px;

$color-text-primary: #374151;
$color-text-secondary: #6B7280;
$color-text-disabled: #9CA3AF;
$color-text-hover: #111418;
$color-bg-hover: #f1f5f9;
$color-icon: #6B7280;
$color-icon-disabled: #D1D5DB;

$transition-fast: 150ms ease;

// ============================================
// MENU BAR
// ============================================
.menu-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.menu-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-family: $menu-font;
  font-size: 14px;
  font-weight: 500;
  color: $color-text-primary;
  background: transparent;
  border: none;
  border-radius: $menu-item-radius;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover,
  &.open {
    background: $color-bg-hover;
    color: $color-text-hover;
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: 2px;
  }
}

.menu-trigger-icon {
  font-size: 16px;
  color: $color-icon;
}

.menu-trigger-chevron {
  font-size: 10px;
  color: $color-text-secondary;
  transition: transform $transition-fast;
  
  .menu-trigger.open & {
    transform: rotate(180deg);
  }
}

// ============================================
// DROPDOWN
// ============================================
.menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 220px;
  background: $menu-bg;
  border: 1px solid $menu-border;
  border-radius: $menu-radius;
  box-shadow: $menu-shadow;
  padding: 6px;
  z-index: 1000;
  
  // Animation
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: all $transition-fast;
  
  &.open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

// ============================================
// DROPDOWN ITEM
// ============================================
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-family: $menu-font;
  font-size: 13px;
  font-weight: 400;
  color: $color-text-primary;
  background: transparent;
  border: none;
  border-radius: $menu-item-radius;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all $transition-fast;
  
  &:hover:not(.disabled) {
    background: $color-bg-hover;
    color: $color-text-hover;
  }
  
  &.disabled {
    color: $color-text-disabled;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid #06B6D4;
    outline-offset: -2px;
  }
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item-icon {
  width: 16px;
  font-size: 14px;
  color: $color-icon;
  
  .menu-item:hover:not(.disabled) & {
    color: $color-text-primary;
  }
  
  .menu-item.disabled & {
    color: $color-icon-disabled;
  }
}

.menu-item-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 12px;
  color: $color-text-secondary;
  margin-left: 24px;
  
  .menu-item.disabled & {
    color: $color-icon-disabled;
  }
}

.menu-submenu-arrow {
  font-size: 12px;
  color: $color-text-secondary;
  margin-left: 8px;
}

// ============================================
// SEPARATOR
// ============================================
.menu-separator {
  height: 1px;
  background: $menu-border;
  margin: 6px 0;
}

// ============================================
// SUBMENU
// ============================================
.menu-submenu-container {
  position: relative;
}

.menu-submenu {
  position: absolute;
  left: calc(100% + 4px);
  top: -6px;
  min-width: 200px;
  background: $menu-bg;
  border: 1px solid $menu-border;
  border-radius: $menu-radius;
  box-shadow: $menu-shadow;
  padding: 6px;
  z-index: 1001;
  
  // Animation
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
  transition: all $transition-fast;
  
  &.open {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }
}

// ============================================
// HEADER INTEGRATION
// ============================================
.main-header {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e4e8;
}

.main-header-logo {
  font-family: $menu-font;
  font-size: 20px;
  font-weight: 700;
  color: #374151;
  margin-right: 32px;
  cursor: pointer;
  
  &:hover {
    color: #111418;
  }
}

.main-header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 8px;
}

.main-header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #06B6D4;
  color: #ffffff;
  font-family: $menu-font;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    background: #0891B2;
  }
}
```

---

**END OF SPECIFICATION**

*Pass this document to Claude in VS Code for implementation.*
