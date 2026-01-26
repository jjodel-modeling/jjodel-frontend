# JJODEL UI REDESIGN - CLAUDE BRIEFING

> Questo file contiene tutte le linee guida per il redesign UI di Jjodel.
> Claude in VS Code deve leggere questo file per ogni modifica UI.

---

## 1. VISION & POSITIONING

### Cos'è Jjodel
Jjodel è un tool di metamodellazione **SaaS** per ricerca e didattica. È l'unico tool di questo tipo veramente cloud-native.

### Target Users (priorità)
1. **Studenti** — non devono essere intimiditi
2. **Accademici/Ricercatori** — devono poterlo adottare nei corsi
3. **Designer DSL** — power users che creano metamodelli
4. **Investitori** (indiretto) — deve apparire enterprise-grade

### Principio Fondamentale
> **Ridotto carico cognitivo** — L'interfaccia non deve intimidire né sovraccaricare.

### Brand Personality
- **Friendly** — le cose devono apparire semplici
- **Moderno** — estetica contemporanea, non datata
- **Serio & Autorevole** — ispira fiducia
- **Professionale** — aspetto enterprise-grade
- **Innovativo** — deve sembrare qualcosa di nuovo, anche sorprendente

### Layered Disclosure Strategy
L'interfaccia comunica a livelli diversi:

| Layer | Cosa Vede l'Utente | Sensazione |
|-------|-------------------|------------|
| Surface | UI pulita, minimal, azioni chiare | "Posso farcela" |
| Middle | Hint di profondità, menu avanzati | "C'è potenza sotto" |
| Deep | Console, OCL, Templates JSX | "Tool serio" |

### Reference Design
- **Framer** — layout simile, dark mode desaturato
- **Figma** — patterns interazione canvas
- **Notion** — semplicità che nasconde potenza

---

## 2. DESIGN TOKENS

### Colori

```scss
// Brand Primary
$color-brand: #374151;
$color-brand-light: #4B5563;
$color-brand-lighter: #6B7280;

// Accent (SLATE - elementi interattivi)
$color-accent: #475569;
$color-accent-hover: #334155;
$color-accent-light: rgba(71, 85, 105, 0.1);
$color-accent-lighter: rgba(71, 85, 105, 0.05);
$color-accent-gradient: linear-gradient(135deg, #64748b 0%, #475569 100%);

// Text
$color-text-primary: #111418;
$color-text-secondary: #6B7280;
$color-text-tertiary: #9CA3AF;
$color-text-inverse: #ffffff;

// Backgrounds
$color-bg-primary: #ffffff;
$color-bg-secondary: #f8fafc;
$color-bg-tertiary: #f1f5f9;

// Borders
$color-border: #e2e4e8;
$color-border-light: #f0f1f2;
$color-border-hover: #d0d3d8;

// Semantic
$color-success: #10b981;
$color-warning: #f59e0b;
$color-error: #ef4444;
$color-info: #3b82f6;

// Danger (per delete buttons)
$color-danger: #ef4444;
$color-danger-light: #fecaca;
```

### Typography

```scss
// Font Family
$font-family: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
$font-family-mono: 'IBM Plex Mono', 'Monaco', monospace;

// Font Sizes
$font-size-xs: 11px;
$font-size-sm: 12px;
$font-size-base: 13px;
$font-size-md: 14px;
$font-size-lg: 16px;
$font-size-xl: 18px;
$font-size-2xl: 24px;

// Font Weights
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;

// Line Heights
$line-height-tight: 1.2;
$line-height-normal: 1.5;
$line-height-relaxed: 1.6;
```

### Spacing

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-2xl: 24px;
$spacing-3xl: 32px;
```

### Border Radius

```scss
$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;
$radius-xl: 12px;
$radius-full: 9999px;
```

### Shadows

```scss
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 1px 3px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### Transitions

```scss
$transition-fast: 150ms ease;
$transition-normal: 250ms ease;
$transition-slow: 400ms ease;
```

---

## 3. COMPONENT PATTERNS

### Buttons

**REGOLA: Gradienti slate consentiti per bottoni primary e toggle.**

```scss
// Base button
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  font-family: $font-family;
  font-size: 13px;
  font-weight: 500;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Primary (azione principale) - SLATE GRADIENT
.btn-primary {
  color: $color-text-inverse;
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border: none;

  // CRITICO: Icone sempre bianche su sfondo scuro
  i, .bi, svg {
    color: #ffffff !important;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #475569 0%, #334155 100%);
  }
}

// Secondary (azione secondaria)
.btn-secondary {
  color: $color-text-primary;
  background-color: transparent;
  border: 1px solid $color-border;
  
  &:hover:not(:disabled) {
    background-color: $color-bg-secondary;
    border-color: $color-border-hover;
  }
}

// Ghost (azione terziaria)
.btn-ghost {
  color: $color-accent;
  background-color: $color-accent-light;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: $color-accent-lighter;
  }
}

// Danger (delete, azioni distruttive)
.btn-danger {
  color: $color-danger;
  background-color: transparent;
  border: 1px solid $color-danger-light;

  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.05);
  }
}
```

### Icone su Bottoni Scuri (REGOLA CRITICA)

**REGOLA: Su bottoni con background slate (solid o gradient), icone e testo DEVONO essere bianchi (#ffffff).**

```scss
// Bottoni slate solid
.btn-slate {
  background: #475569;           // slate-600
  color: #ffffff;

  i, .bi, svg {
    color: #ffffff !important;   // Icone sempre bianche
  }
}

// Bottoni slate gradient (primary)
.btn-primary {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: #ffffff;

  i, .bi, svg {
    color: #ffffff !important;   // Icone sempre bianche
  }
}
```

| Background | Richiede icone bianche? |
|------------|------------------------|
| slate-50 to slate-300 | No (icone scure OK) |
| slate-400 | Borderline (preferire bianche) |
| **slate-500 to slate-900** | **SÌ, sempre bianche** |
| **Gradient slate** | **SÌ, sempre bianche** |

**❌ SBAGLIATO:**
```html
<button class="btn-primary">
  <i class="bi bi-check" style="color: #334155"></i> <!-- Invisibile! -->
  Save
</button>
```

**✅ CORRETTO:**
```html
<button class="btn-primary">
  <i class="bi bi-check"></i> <!-- Eredita bianco dal parent -->
  Save
</button>
```

### Toggle Switch (NON checkbox!)

**REGOLA: Usare toggle switch per boolean, MAI checkbox nativi browser.**

```scss
.toggle {
  width: 48px;
  height: 26px;
  border-radius: 26px;
  background-color: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%); // slate gradient
  }
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .toggle.active & {
    transform: translateX(22px);
  }
}
```

### Custom Checkbox (quando serve lista di opzioni)

```scss
.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: $radius-sm;
  border: 2px solid $color-border-hover;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    border-color: $color-accent;
  }
  
  &.checked {
    border: none;
    background-color: $color-accent;
    
    .checkmark {
      color: #ffffff;
    }
  }
}
```

### Inputs

```scss
.input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-family: $font-family;
  font-size: 14px;
  color: $color-text-primary;
  background-color: #ffffff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  outline: none;
  transition: border-color $transition-fast, box-shadow $transition-fast;
  
  &:focus {
    border-color: $color-accent;
    box-shadow: 0 0 0 3px $color-accent-light;
  }
  
  &::placeholder {
    color: $color-text-tertiary;
  }
}
```

### Select

```scss
.select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-family: $font-family;
  font-size: 14px;
  color: $color-text-primary;
  background-color: #ffffff;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235c6370' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  
  &:focus {
    border-color: $color-accent;
    box-shadow: 0 0 0 3px $color-accent-light;
  }
}
```

### Section Headers

```scss
.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-tertiary;
  margin-bottom: 12px;
}
```

### Badges

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: $radius-sm;
  
  &.badge-metamodel {
    background-color: $color-accent-light;
    color: $color-accent;
  }
  
  &.badge-model {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  &.badge-class {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}
```

### Stat Cards

```scss
.stat-card {
  padding: 12px;
  background-color: $color-bg-secondary;
  border-radius: $radius-lg;
  
  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: 2px;
  }
  
  .stat-label {
    font-size: 12px;
    color: $color-text-secondary;
  }
}
```

### Tree Type Icons (Viewpoints/TreeView)

**REGOLA: Usare colori pastel consistenti per tutti i tree.**
```scss
// Viewpoint/View type colors
$color-viewpoint: #8b5cf6;    // Purple - Viewpoints
$color-view-vertex: #3b82f6;  // Blue - Vertex views
$color-view-field: #64748b;   // Slate - Field views  
$color-view-edge: #06b6d4;    // Cyan - Edge views
$color-view-graph: #10b981;   // Green - Graph views

// Badge style: background 12-15% opacity, text full color
.tree-icon {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  
  &.tree-DViewPoint {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
  }
}
```

### Feature Badges (OCL/JS/EX)

**REGOLA: Muted colors, non saturati, per ridurre rumore visivo.**
```scss
.feature-badge {
  min-width: 24px;
  height: 20px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  
  // OCL - subtle red
  &.ocl { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  
  // JS - subtle amber  
  &.js { background: rgba(245, 158, 11, 0.1); color: #d97706; }
  
  // EX - subtle green (or gray when inactive)
  &.ex { background: rgba(16, 185, 129, 0.1); color: #059669; }
  &.ex.inactive { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
}
```

---

## 4. PAGE-SPECIFIC GUIDELINES

### Login Page

**Layout:** Split screen — dark panel left, form right

**Left Panel:**
- Background: #1e2024 (dark)
- Logo "Jjodel." in bianco
- "Welcome to Jjodel" heading
- Tagline in grigio chiaro
- RESEARCH PARTNERS + 3 loghi (bianco/grigio, piccoli)
- Link "jjodel.io" in basso

**Right Panel:**
- Background: #f8f9fa (grigio chiaro)
- Form card bianca con ombra leggera
- Bottone Login: teal primary
- Bottone Offline mode: secondary outlined

**❌ NON includere:**
- Testo lungo del dipartimento (ridondante)
- Feature icons (rimossi per pulizia)

### Dashboard

**LAYOUT GENERALE:**
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (60px)                                                    │
│ Logo sx | Nav (Projects, Templates, Explore) | Help + Avatar dx │
├────────────┬────────────────────────────────────────────────────┤
│ SIDEBAR    │ CONTENT                                             │
│ (240px)    │                                                     │
│            │ Page Title          [Import] [+ New Project]        │
│ All proj   │                                                     │
│ Favorites  │ [Tabs: All | Public | Private | Collab]  [Grid/List]│
│ Trash      │                                                     │
│            │ ┌─────────────────────────────────────────────────┐ │
│ ────────── │ │ PROJECT CARDS o EMPTY STATE                     │ │
│ RECENTLY   │ │                                                 │ │
│ (se pieno) │ │                                                 │ │
│            │ └─────────────────────────────────────────────────┘ │
│ ────────── │                                                     │
│ SUPPORT    │                                                     │
│ Docs       │                                                     │
│ Tutorials  │                                                     │
│            │                                                     │
│ ────────── │                                                     │
│ v2.0       │                                                     │
└────────────┴────────────────────────────────────────────────────┘
```

**HEADER:**
- Altezza: 60px
- Background: #ffffff
- Border-bottom: 1px solid #e2e4e8
- Logo "Jjodel." a SINISTRA (non centrato), font-weight 700, color #374151
- Nav tabs al centro-sinistra: Projects (active), Templates, Explore
- Help button + Avatar a destra

**SIDEBAR:**
- Larghezza: 240px
- Background: #ffffff
- Border-right: 1px solid #e2e4e8
- Sezioni:
  1. Main nav: All projects, Favorites, Trash
  2. Recently Modified (SOLO se ci sono progetti, altrimenti NASCOSTA)
  3. Support: Documentation, Tutorials
  4. Footer: solo "Jjodel v2.0"

**CTA BUTTONS (in alto a destra del content):**
- Solo 2 bottoni:
  1. "Import" → btn-secondary (outlined)
  2. "New Project" → btn-primary (slate gradient)
- NO terzo bottone "Getting Started"
- Gradienti slate consentiti per btn-primary

**EMPTY STATE (quando 0 progetti):**
```
┌─────────────────────────────────────────┐
│                                         │
│        [icona bi-rocket-takeoff]        │
│                                         │
│        Welcome to Jjodel!               │
│                                         │
│  Create your first project to start     │
│  modeling. Jjodel makes metamodeling    │
│  accessible for research and education. │
│                                         │
│     [+ Create your first project]       │
│                                         │
│  New to Jjodel? Getting Started guide → │
│                                         │
└─────────────────────────────────────────┘
```
- Icona: bi-rocket-takeoff, 36px, color slate (#475569)
- Titolo: "Welcome to Jjodel!", 22px, semibold
- Descrizione: 15px, color secondary, max-width 400px
- CTA: btn-primary grande
- Link secondario: "New to Jjodel? Getting Started guide →"

**PROJECT CARDS (quando ci sono progetti):**
- Grid: auto-fill, minmax(280px, 1fr), gap 20px
- Card: bg white, border-radius 12px, border 1px solid #e2e4e8
- Preview area: 140px height, bg #f1f5f9, icona bi-diagram-3
- Info: padding 16px, nome progetto, "Modified X ago", badge tipo

**TABS FILTRO:**
- Container: bg #f1f5f9, padding 4px, border-radius 8px
- Tab attivo: bg white, shadow leggera
- Tab inattivo: bg transparent

**VIEW TOGGLE:**
- Grid: bi-grid-3x3-gap
- List: bi-list

**❌ VIETATO NELLA DASHBOARD:**
- Terzo bottone CTA colorato (es. "Getting Started" arancio)
- Gradienti sui bottoni
- "RECENTLY MODIFIED" visibile quando vuoto
- "Sorry, no results matching..." come empty state
- Footer "Made with ❤️"
- Logo centrato nell'header

**📁 IMPLEMENTATION FILES:**
```
Dashboard Components:
├── /frontend/src/pages/components/Navbar.tsx      → Header con logo, nav tabs, avatar
├── /frontend/src/pages/components/navbar.scss     → Stili header (60px height)
├── /frontend/src/pages/components/LeftBar.tsx     → Sidebar 240px
├── /frontend/src/pages/components/catalog/
│   ├── Catalog.tsx                                → EmptyState, filter tabs, view toggle
│   └── catalog.scss                               → Stili empty state, grid, tabs
├── /frontend/src/pages/components/Project.tsx     → Project card component
├── /frontend/src/pages/AllProjects.tsx            → CTA buttons row (Import + New Project)
└── /frontend/src/pages/dashboard.scss             → Container layout, card styles
```

**Key Implementation Notes:**
- `EmptyState` component in Catalog.tsx shows rocket icon when 0 projects
- `hasProjects` check in LeftBar.tsx hides "Recently Modified" when empty
- `NavTabs` component in Navbar.tsx shows Projects/Templates/Explore tabs
- All icons use Bootstrap Icons (bi-*), no react-icons or emoji
- Project cards use `.project-card-v2` class with hover border-color cyan

### Properties Tab (Right Panel)

**Struttura:**
1. **Header** — icona + nome + badge tipo + descrizione
2. **Overview** — grid 2x2 stats (Classes, Attributes, References, Operations)
3. **Details** — form verticale (Name, Readonly toggle, Dependencies, State)
4. **Info** — Created by, Last modified
5. **Actions** — Edit (primary), Duplicate (secondary), Delete (danger icon)

**Layout form:**
- Labels sopra gli input (non accanto)
- Input full width
- Readonly usa TOGGLE, non checkbox
- Sezioni separate da border-bottom sottile

---

## 5. DO's AND DON'Ts

### ✅ DO

- Usare SOLO i colori del design system
- Toggle switch per boolean
- Bottoni con stili consistenti (primary/secondary/ghost/danger)
- **Icone bianche (#ffffff) su bottoni con sfondo slate o gradient**
- Layout verticale per form (label sopra, input sotto)
- Spacing consistente (16px padding sezioni, 12px gap elementi)
- Transizioni smooth su interazioni
- Sezioni con titoli uppercase e spacing
- Badge per indicare tipi (Metamodel, Model, Class)

### ❌ DON'T

- **MAI** checkbox nativi del browser
- **MAI** gradienti non-slate (solo slate gradient consentito per primary/toggle)
- **MAI** colori fuori dal design system (cyan, rosa, viola random)
- **MAI** icone scure su bottoni con sfondo slate/scuro (devono essere bianche!)
- **MAI** layout form orizzontale per input lunghi
- **MAI** testo troppo denso senza gerarchia
- **MAI** icone colorate casuali (usa slate o grigio)
- **MAI** bottoni con dimensioni sproporzionate
- **MAI** mix di stili diversi nella stessa area
- **MAI** usare emoji (usa testo o Bootstrap Icons)

---

## 6. TECH STACK

- **Framework:** React con customizzazioni
- **Styling:** SCSS
- **State:** Redux
- **Canvas:** SVG
- **Font:** Inter Variable (già installato)
- **Icons:** Bootstrap Icons (SOLO questa libreria)

---

## 7. ICONS — BOOTSTRAP ICONS ONLY

**REGOLA CRITICA: Usare ESCLUSIVAMENTE Bootstrap Icons.**

Documentazione: https://icons.getbootstrap.com/

### Formato utilizzo

```jsx
// In React/JSX
<i className="bi bi-folder"></i>
<i className="bi bi-plus-lg"></i>
<i className="bi bi-star"></i>
```

### Icone approvate per Jjodel

| Contesto | Icona | Classe |
|----------|-------|--------|
| Cartella/Projects | folder | `bi-folder` |
| Nuovo/Aggiungi | plus | `bi-plus-lg` |
| Preferiti | star | `bi-star` |
| Cestino | trash | `bi-trash` |
| File | file | `bi-file-earmark` |
| Documento | document | `bi-file-text` |
| Modifica/Edit | pencil | `bi-pencil` |
| Duplica | copy | `bi-copy` |
| Elimina | trash | `bi-trash` |
| Impostazioni | gear | `bi-gear` |
| Cerca | search | `bi-search` |
| Chiudi | x | `bi-x-lg` |
| Freccia destra | arrow | `bi-arrow-right` |
| Freccia sinistra | arrow | `bi-arrow-left` |
| Chevron giù | chevron | `bi-chevron-down` |
| Chevron su | chevron | `bi-chevron-up` |
| Download/Import | download | `bi-download` |
| Upload/Export | upload | `bi-upload` |
| Help | question | `bi-question-circle` |
| Info | info | `bi-info-circle` |
| Warning | warning | `bi-exclamation-triangle` |
| Error | error | `bi-x-circle` |
| Success | check | `bi-check-circle` |
| User/Avatar | person | `bi-person-circle` |
| Menu | list | `bi-list` |
| Grid view | grid | `bi-grid-3x3-gap` |
| List view | list | `bi-list-ul` |
| Diagram/Model | diagram | `bi-diagram-3` |
| Code | code | `bi-code-slash` |
| Eye/View | eye | `bi-eye` |
| Eye off | eye-slash | `bi-eye-slash` |
| Lock | lock | `bi-lock` |
| Unlock | unlock | `bi-unlock` |
| Link | link | `bi-link-45deg` |
| External link | external | `bi-box-arrow-up-right` |
| Documentation | book | `bi-book` |
| Tutorial | education | `bi-mortarboard` |
| Rocket/Start | rocket | `bi-rocket-takeoff` |
| Calendar | calendar | `bi-calendar` |
| Clock | clock | `bi-clock` |
| Filter | filter | `bi-funnel` |
| Sort | sort | `bi-sort-down` |
| Refresh | refresh | `bi-arrow-clockwise` |
| Toggle on | toggle | `bi-toggle-on` |
| Toggle off | toggle | `bi-toggle-off` |

### Stile icone

```scss
// Dimensioni standard
.icon-sm { font-size: 14px; }
.icon-md { font-size: 16px; }
.icon-lg { font-size: 20px; }
.icon-xl { font-size: 24px; }

// Colori (usare variabili)
.bi {
  color: inherit; // eredita dal parent
}
```

### ❌ VIETATO

- **MAI** usare emoji (🚀 ❌ ✅ 📁 etc.)
- **MAI** usare Font Awesome
- **MAI** usare Material Icons
- **MAI** usare Heroicons
- **MAI** usare icone SVG inline custom
- **MAI** usare caratteri Unicode come icone (→ ← ✓ ✗)

---

## 7. FILE LOCATIONS

- Design tokens: `/frontend/src/styles/_variables.scss` (o simile)
- Components: `/frontend/src/components/`
- Editors (right panel): `/frontend/src/components/editors/`

---

## 8. QUANDO HAI DUBBI

1. Rileggi questo file
2. Pensa: "Un utente nuovo si spaventa?"
3. Pensa: "È consistente con il resto?"
4. Segui il principio: **Minimal, Friendly, Professionale**

---

*Ultimo aggiornamento: Gennaio 2026*
