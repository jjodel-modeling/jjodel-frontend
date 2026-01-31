# JJODEL UI REDESIGN - MASTER SPECIFICATION

**Version:** 2.0  
**Last Updated:** January 21, 2026  
**Status:** ~45% Complete  
**Purpose:** Single source of truth per il redesign UI di Jjodel

---

## 📋 TABLE OF CONTENTS

1. [Project Vision](#1-project-vision)
2. [Design System](#2-design-system)
3. [Component Status Matrix](#3-component-status-matrix)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Technical Stack](#5-technical-stack)
6. [Quality Checklist](#6-quality-checklist)
7. [VS Code Integration](#7-vs-code-integration)

---

## 1. PROJECT VISION

### 1.1 What is Jjodel?

**Jjodel** è un tool SaaS open-source di **metamodellazione** per ricerca e educazione.

**Target Users:**
- Ricercatori accademici
- Studenti universitari
- Team di sviluppo software (Model-Driven Engineering)

**Core Features:**
- Editor visuale di metamodelli (Ecore-based)
- Gestione progetti e versioning
- Import/export di metamodelli
- Validazione e constraints

### 1.2 Design Philosophy

> **"Friendly but Authoritative"**

**Principles:**
1. **Professional & Enterprise** - No "candy colors", aspetto maturo
2. **Reduced Cognitive Load** - UI pulita, minimalista
3. **Academic Credibility** - Adatto per pubblicazioni e demo
4. **Open-Source Friendly** - Accessibile, documentato, estensibile

**Visual Direction:**
- Palette monocromatica (slate + grays)
- Tipografia Inter Variable
- Spazi generosi, respiro visivo
- Transizioni sottili, no animazioni eccessive

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette

#### PRIMARY: Slate Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `$slate-50` | `#f8fafc` | Background principale |
| `$slate-100` | `#f1f5f9` | Cards, panels |
| `$slate-150` | `#e9eff6` | Hover su elementi chiari |
| `$slate-200` | `#e2e8f0` | Hover states, superfici secondarie |
| `$slate-250` | `#d1d9e3` | Bordi sottili (mid-point) |
| `$slate-300` | `#cbd5e1` | Bordi primari |
| `$slate-400` | `#94a3b8` | Testo molto sottile |
| `$slate-500` | `#64748b` | Placeholder/disabled |
| `$slate-600` | `#475569` | **ACCENT COLOR** - Testo terziario |
| `$slate-700` | `#334155` | Testo secondario, hover accent |
| `$slate-800` | `#1e293b` | Hover su elementi scuri |
| `$slate-900` | `#0f172a` | Testo primario |

#### ACCENT: Slate 600

```scss
$color-accent: #475569;        // CTA primari
$color-accent-hover: #334155;  // Hover CTA
$color-accent-light: #f1f5f9;  // Background leggero
```

**✅ REGOLA D'ORO:**
> Slate (#475569) è l'accent color - solo per CTA primari e focus rings.
> NO cyan, NO teal, NO colori "caramellosi".

#### SEMANTIC: Functional Colors

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Success | Green | `#10B981` | Operazioni completate |
| Error | Red | `#EF4444` | Errori, delete |
| Warning | Amber | `#F59E0B` | Attenzione |
| Info | Blue | `#3b82f6` | Informazioni |

### 2.2 Typography

**Font Family:**
```scss
$font-sans: 'Inter Variable', sans-serif;
$font-mono: 'IBM Plex Mono', monospace;
```

**Font Sizes:**
| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Metadata, timestamps |
| `text-sm` | 14px | Body text, buttons |
| `text-base` | 16px | Default text |
| `text-lg` | 18px | Subtitles |
| `text-xl` | 20px | Section headers |
| `text-2xl` | 24px | Page titles |

**Font Weights:**
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### 2.3 Spacing (4px Grid)

| Token | Size | Usage |
|-------|------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Button padding Y |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard gap |
| `space-5` | 20px | Medium gap |
| `space-6` | 24px | Large gap |
| `space-8` | 32px | Section spacing |
| `space-12` | 48px | Page margins |

### 2.4 Shadows

| Token | CSS | Usage |
|-------|-----|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dropdowns |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Modals |

### 2.5 Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `radius-sm` | 4px | Buttons, inputs |
| `radius-md` | 6px | Cards |
| `radius-lg` | 8px | Panels |
| `radius-full` | 9999px | Badges, pills |

### 2.6 Transitions

```scss
$transition-fast: 150ms ease-out;
$transition-normal: 200ms ease-out;
$transition-slow: 300ms ease-out;

$transition-button: all 150ms ease-out;
$transition-modal: all 200ms ease-out;
```

---

## 3. COMPONENT STATUS MATRIX

### Legend
- ✅ **DONE** - Implementato e testato
- 🚧 **IN PROGRESS** - In sviluppo
- ⚠️ **NEEDS FIX** - Implementato ma con issue
- 📋 **TODO** - Non iniziato
- 🔮 **FUTURE** - Nice-to-have, non prioritario

---

### 3.1 LAYOUT COMPONENTS

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Main Layout** | ✅ DONE | ✅ High | Navbar + Sidebar + Content |
| **Navbar** | ✅ DONE | ✅ High | Top bar con menu |
| **Sidebar** | ✅ DONE | ✅ High | Con favorites + footer |
| **Footer** | ✅ DONE | ✅ High | Solo in Editor, non in Dashboard |
| **Right Panel (Tabs)** | 📋 TODO | ⚠️ Medium | Spec: `right-panel-tabs-spec.md` |

---

### 3.2 NAVIGATION & MENU

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Main Menu** | 📋 TODO | ⚠️ Medium | Spec: `jjodel-menu-spec.md` |
| **Context Menu** | 📋 TODO | ⚠️ Medium | Right-click menus |
| **Dock Tabs** | ✅ DONE | ✅ High | Bottom editor tabs |

---

### 3.3 DASHBOARD

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Project Cards** | ⚠️ NEEDS FIX | ✅ High | 3 issues pendenti (vedi sotto) |
| **Project Grid** | ✅ DONE | ✅ High | Grid + Compact views |
| **Search Bar** | ✅ DONE | ✅ High | Con debounce |
| **View Toggles** | ✅ DONE | ⚠️ Medium | Grid/Compact (Slider 🔮 future) |
| **Empty State (Onboarding Hub)** | ✅ DONE | ⚠️ Medium | Welcome + 3-step cards + resources |

#### Empty State - Onboarding Hub ✅ DONE

**Implemented:** 2025-01-21

**Files:**
- `src/components/EmptyDashboard/EmptyDashboard.tsx`
- `src/components/EmptyDashboard/empty-dashboard.scss`

**Features:**
- Welcome hero with rocket icon
- 3-step onboarding cards (Quick Start, Learn Basics, Explore)
- Popular Resources section with 4 links
- Help footer with community/docs links
- Responsive grid (3 cols > 2 cols > 1 col)
- Bootstrap Icons only (no emoji)
- Slate color palette

#### Project Cards - PENDING FIXES

**Issue #1: Menu Overflow** ⚠️
```
Problema: Il dropdown menu (⋮) esce fuori dalla card
Fix: 
- project-card { overflow: visible }
- dropdown { z-index: 1000, position: absolute }
```

**Issue #2: Allineamento Vista Compatta** ⚠️
```
Problema: Colonne non allineate in compact view
Fix: Grid con colonne fisse:
- Nome: 280px + text-overflow ellipsis
- Stats: 1fr
- Badge/Stella/Menu: auto
```

**Issue #3: Icone Trasparenti** ⚠️
```
Problema: Stella e menu hanno sfondo bianco
Fix:
- background: transparent
- color: rgba(255,255,255,0.7)
- hover: rgba(255,255,255,1)
- favorite attivo: #facc15 (giallo)
```

---

### 3.4 WIDGETS

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Notification Widget** | ✅ DONE | ✅ High | Integrato con Notion |
| **AI Assistant (Jjodie)** | 🚧 IN PROGRESS | ⚠️ Medium | Markdown render + actions |
| **Tag System** | 📋 TODO | ⚠️ Medium | Tags per progetti |

---

### 3.5 DIALOGS & MODALS

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **About Dialog** | 📋 TODO | 🔵 Low | Redesign needed |
| **Confirm Dialog** | 📋 TODO | ⚠️ Medium | Spec: `dialogs-modals-spec.md` |
| **Settings Modal** | 📋 TODO | 🔵 Low | - |
| **Import/Export Dialog** | 📋 TODO | ⚠️ Medium | - |

---

### 3.6 FORM CONTROLS

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Buttons** | ✅ DONE | ✅ High | Primary, Secondary, Ghost, Danger |
| **Input Fields** | 📋 TODO | ✅ High | Text, number, email |
| **Select Dropdown** | 📋 TODO | ✅ High | - |
| **Checkbox** | 📋 TODO | ⚠️ Medium | - |
| **Toggle Switch** | 📋 TODO | ⚠️ Medium | - |
| **Radio Buttons** | 📋 TODO | 🔵 Low | - |

---

### 3.7 EDITOR COMPONENTS

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Canvas** | ✅ DONE | ✅ High | No redesign needed |
| **Toolbar** | 📋 TODO | ⚠️ Medium | - |
| **Properties Panel** | 📋 TODO | ⚠️ Medium | - |
| **Tree View** | 📋 TODO | ⚠️ Medium | File tree nella sidebar |

---

## 4. IMPLEMENTATION ROADMAP

### PHASE 1: Foundation ✅ COMPLETATO (100%)

**Duration:** ~1 week  
**Status:** ✅ DONE

- [x] Design Token System
- [x] Light + Dark theme infrastructure
- [x] Typography setup (Inter Variable)
- [x] Color migration (Cyan → Slate)
- [x] Spacing scale (4px grid)
- [x] Shadow system
- [x] Documentation

**Deliverables:**
- `/frontend/src/styles/tokens/` (13 files)
- Token preview page (`/test-tokens`)
- Migration guide

---

### PHASE 2: Core Dashboard ⚠️ IN CORSO (70%)

**Duration:** ~1 week  
**Status:** 🚧 IN PROGRESS

#### 2.1 Dashboard Components ✅ DONE
- [x] Notification Widget (Notion integration)
- [x] Project Cards (con gradienti)
- [x] Grid/Compact views
- [x] Search bar
- [x] Sidebar favorites
- [x] Footer (solo in Editor)

#### 2.2 Pending Fixes ⚠️ NEXT SESSION
- [ ] Fix menu overflow nelle cards
- [ ] Fix allineamento vista compatta
- [ ] Fix icone stella/menu trasparenti

#### 2.3 Form Controls 📋 TODO
- [ ] Input fields redesign
- [ ] Select dropdown redesign
- [ ] Checkbox redesign
- [ ] Toggle switch redesign

**Priority:** ✅ HIGH  
**Estimated Time:** 2-3 giorni

---

### PHASE 3: Navigation & Menus 📋 TODO (0%)

**Duration:** ~3-4 giorni  
**Status:** 📋 TODO

- [ ] Main menu redesign (spec: `jjodel-menu-spec.md`)
- [ ] Context menus
- [ ] Right panel tabs (spec: `right-panel-tabs-spec.md`)
- [ ] Toolbar redesign

**Priority:** ⚠️ MEDIUM  
**Estimated Time:** 3-4 giorni

---

### PHASE 4: Dialogs & Modals 📋 TODO (0%)

**Duration:** ~2-3 giorni  
**Status:** 📋 TODO

- [ ] Confirm dialogs (spec: `dialogs-modals-spec.md`)
- [ ] About dialog redesign
- [ ] Import/Export dialogs
- [ ] Settings modal

**Priority:** ⚠️ MEDIUM  
**Estimated Time:** 2-3 giorni

---

### PHASE 5: Editor & Advanced 📋 TODO (0%)

**Duration:** ~1 week  
**Status:** 📋 TODO

- [ ] Toolbar redesign
- [ ] Properties panel redesign
- [ ] Tree view styling
- [ ] AI Assistant (Jjodie) completamento
- [ ] Tag system per progetti

**Priority:** ⚠️ MEDIUM  
**Estimated Time:** 5-7 giorni

---

### PHASE 6: Nice-to-Have 🔮 FUTURE

**Duration:** TBD  
**Status:** 🔮 BACKLOG

- [ ] Slider view (carousel progetti)
- [ ] AI Assistant RAG (knowledge base)
- [ ] Dark mode perfezionamento
- [ ] Animazioni avanzate
- [ ] Accessibility audit (WCAG AA)

**Priority:** 🔵 LOW  
**Estimated Time:** TBD

---

## 5. TECHNICAL STACK

### 5.1 Frontend

```
React 18.x
TypeScript
SCSS (con design tokens)
Vite (build tool)
```

### 5.2 Backend Services

**Notification Widget:**
- Notion API (database `2eb4b66bdb50802fa2cfdcdd7aae3fbf`)
- Cloudflare Worker (proxy)
- URL: `https://jjodel-notifications.alfonso-pierantonio.workers.dev`

### 5.3 File Structure

```
/frontend
├── /src
│   ├── /styles
│   │   ├── /tokens          ← Design tokens (Phase 1)
│   │   ├── variables.scss
│   │   ├── style.scss
│   │   └── ...component.scss
│   ├── /components
│   │   ├── /NotificationWidget
│   │   └── ...
│   ├── /pages
│   │   ├── Catalog.tsx      ← Dashboard
│   │   ├── Editor.tsx
│   │   └── TokenPreview.tsx
│   └── App.tsx
├── /docs
│   └── /redesign
│       ├── JJODEL-UI-MASTER-SPEC.md  ← Questo file
│       ├── color-usage-guidelines.md
│       ├── notification-widget-spec.md
│       ├── project-card-spec.md
│       ├── dialogs-modals-spec.md
│       ├── jjodel-menu-spec.md
│       └── right-panel-tabs-spec.md
```

---

## 6. QUALITY CHECKLIST

### 6.1 Visual Quality

Ogni componente deve rispettare:

- [ ] **Tokens Only** - Zero hardcoded colors/spacing
- [ ] **Slate Accent** - Solo per CTA primari (#475569)
- [ ] **Contrast WCAG AA** - Minimo 4.5:1 per testo
- [ ] **Spacing 4px Grid** - Tutti i margini/padding multipli di 4
- [ ] **Hover States** - Transizioni smooth (150-200ms)
- [ ] **Focus Rings** - Outline 2px slate per accessibilità
- [ ] **No Gradients** - Tranne project card covers
- [ ] **Icon Size** - 16px o 20px (mai numeri dispari)

### 6.2 Code Quality

- [ ] **TypeScript Types** - No `any`, props tipate
- [ ] **SCSS Modules** - File component-specific
- [ ] **No Inline Styles** - Usa classi CSS
- [ ] **BEM Naming** - `.block__element--modifier`
- [ ] **Responsive** - Mobile-friendly (min 320px)
- [ ] **Dark Mode Ready** - Tutti i token compatibili
- [ ] **Comments** - Sezioni complesse documentate

### 6.3 Performance

- [ ] **Lazy Loading** - Componenti pesanti
- [ ] **Debounce** - Search input, autocomplete
- [ ] **Memoization** - Liste lunghe con React.memo
- [ ] **Bundle Size** - < 500KB totale (gzip)

---

## 7. VS CODE INTEGRATION

### 7.1 Come Usare Questa Spec con Claude in VS Code

**Step 1: Identifica il Task**

Esempio: "Voglio fixare il menu overflow nelle project cards"

**Step 2: Trova la Sezione Rilevante**

Vai a: **Section 3.3 Dashboard > Project Cards - PENDING FIXES > Issue #1**

```markdown
**Issue #1: Menu Overflow** ⚠️
Fix: 
- project-card { overflow: visible }
- dropdown { z-index: 1000, position: absolute }
```

**Step 3: Crea il Prompt per Claude**

```
Riferimento: JJODEL-UI-MASTER-SPEC.md > Section 3.3 > Issue #1

Fix menu overflow nelle project cards:
- File: frontend/src/styles/project-card.scss
- Rimuovi overflow: hidden dalla .project-card
- Dropdown menu deve avere z-index: 1000
- Position: absolute per il dropdown

Verifica che il menu non esca mai fuori dalla viewport.
```

**Step 4: Claude Implementa**

Claude in VS Code aprirà i file, farà le modifiche, ti mostrerà un diff.

**Step 5: Aggiorna lo Status**

Dopo merge, aggiorna questa spec:

```diff
- **Issue #1: Menu Overflow** ⚠️
+ **Issue #1: Menu Overflow** ✅ FIXED
```

---

### 7.2 Prompt Templates Pronti

#### Fix Generico
```
Riferimento: JJODEL-UI-MASTER-SPEC.md > Section [X.X]

Task: [descrizione breve]

Files:
- [path1]
- [path2]

Requirements:
- Usa design tokens da /styles/tokens/
- Segui Quality Checklist (Section 6)
- Commenta codice complesso

Test visuale in browser dopo implementazione.
```

#### Nuovo Componente
```
Riferimento: JJODEL-UI-MASTER-SPEC.md > Section [X.X]

Implementa componente: [Nome]

Spec:
- Colors: usa $slate-* tokens
- Spacing: 4px grid
- Typography: Inter Variable
- Transitions: 150ms ease-out

Files da creare:
- components/[Nome]/[Nome].tsx
- components/[Nome]/[nome].scss

Segui Design System (Section 2).
```

#### Redesign Esistente
```
Riferimento: JJODEL-UI-MASTER-SPEC.md > Section [X.X]

Redesign componente esistente: [Nome]

Current file: [path]

Changes:
1. Sostituisci colori hardcoded con tokens
2. Applica spacing 4px grid
3. Aggiungi hover states
4. Verifica contrast WCAG AA

Mantieni funzionalità esistenti, solo visual update.
```

---

### 7.3 Workflow Consigliato

**🔄 Iterazione Tipica:**

1. **Leggi Spec** - Identifica task da questa spec
2. **Prompt Claude** - Usa template sopra
3. **Review Diff** - Controlla modifiche in VS Code
4. **Test Visuale** - `npm start` e verifica in browser
5. **Commit** - Messaggio descrittivo
6. **Aggiorna Spec** - Cambia status da 📋 TODO → ✅ DONE

**⏱️ Time Boxing:**
- Task piccolo (fix): 15-30 min
- Task medio (componente): 1-2 ore
- Task grande (sistema): mezza giornata

**🎯 Focus:**
- Max 3 task in parallelo
- Completa Phase 2 prima di iniziare Phase 3
- Fix pending issues prima di nuove features

---

## 8. QUICK REFERENCE

### 8.1 Color Usage

| Elemento | Colore | Token |
|----------|--------|-------|
| CTA Primary | Slate 600 | `$color-accent` |
| Testo Primario | Slate 900 | `$color-text-primary` |
| Testo Secondario | Slate 700 | `$color-text-secondary` |
| Background | Slate 50 | `$slate-50` |
| Card Background | Slate 100 | `$slate-100` |
| Border | Slate 300 | `$color-border-primary` |
| Hover Background | Slate 200 | `$color-bg-hover` |
| Success | Green | `$green-500` |
| Error | Red | `$red-500` |
| Warning | Amber | `$amber-500` |

### 8.2 Common Patterns

**Button Primary:**
```scss
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  transition: var(--transition-button);
  
  &:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
  }
}
```

**Card:**
```scss
.card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
```

**Input:**
```scss
.input {
  height: 36px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  transition: var(--transition-normal);
  
  &:focus {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}
```

---

## 9. APPENDIX

### 9.1 External Resources

- **Design Tokens:** `/frontend/src/styles/tokens/README.md`
- **Figma:** [link se disponibile]
- **Notion Notifications:** Database `2eb4b66bdb50802fa2cfdcdd7aae3fbf`
- **Cloudflare Worker:** `https://jjodel-notifications.alfonso-pierantonio.workers.dev`

### 9.2 Contacts

- **Project Lead:** Alfonso Pierantonio
- **Repository:** [GitHub URL]
- **Documentation:** `/docs/redesign/`

### 9.3 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2026-01-21 | Empty State Onboarding Hub implementato |
| 2.0 | 2026-01-21 | Master spec unificata creata |
| 1.x | 2025-2026 | Specs individuali per componenti |

---

## 10. SUMMARY STATS

### Completion Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ DONE | 100% |
| Phase 2: Core Dashboard | 🚧 IN PROGRESS | 80% |
| Phase 3: Navigation | 📋 TODO | 0% |
| Phase 4: Dialogs | 📋 TODO | 0% |
| Phase 5: Editor | 📋 TODO | 0% |
| Phase 6: Nice-to-Have | 🔮 FUTURE | 0% |

**Overall Progress:** ~48%

### Next 3 Priorities

1. ⚠️ **Fix Project Card Issues** (3 fixes)
2. 📋 **Form Controls Redesign**
3. ⚠️ **Main Menu Redesign**

---

**END OF MASTER SPECIFICATION**

*Questo documento è la fonte unica di verità per il redesign Jjodel UI.*  
*Aggiornalo dopo ogni sessione di lavoro.*  
*Usalo come riferimento in tutti i prompt a Claude.*

---

**Generated:** January 21, 2026  
**By:** Claude Sonnet 4.5  
**For:** Alfonso Pierantonio
