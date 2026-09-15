---
title: Feature Inventory
generated: 2026-04-22
source: frontend/src/
total_features: 348
---

# Feature Inventory

> Censimento automatico delle feature della piattaforma Jjodel, generato tramite scan del codebase.
> Usato come base per la progressive disclosure Basic/Advanced nella UI.
> Le classificazioni tier sono **ipotesi iniziali da revisionare manualmente**.
>
> **Legenda tier:** 🟢 Basic confermato · 🟡 Ambiguo · 🔴 Advanced · ⚠️ feature visibile ma non implementata
> **Audience:** `all` · `student` · `educator` · `researcher` · `contributor`
> **Frequenza:** `always` · `often` · `sometimes` · `rarely`
> **Rischio:** `safe` · `reversible` · `confirm` · `destructive`

---

## Sommario per area

| # | Area | L2 | L3 | 🟢 | 🟡 | 🔴 | ⚠️ |
|---|------|----|----|----|----|----|----|
| 1 | Project Dashboard & Shell | 4 | 11 | 7 | 2 | 2 | 0 |
| 2 | Navbar & Menu globali | 7 | 56 | 18 | 11 | 27 | 6 |
| 3 | Dock / Layout System | 2 | 6 | 2 | 1 | 3 | 0 |
| 4 | Metamodel & Model Editor (V2) | 6 | 31 | 14 | 8 | 9 | 0 |
| 5 | Properties Panel | 5 | 39 | 22 | 10 | 7 | 0 |
| 6 | Tree View Sidebar | 2 | 8 | 6 | 1 | 1 | 0 |
| 7 | Right Panel (Activity) | 3 | 11 | 7 | 2 | 2 | 0 |
| 8 | JjTL Transformation Editor | 6 | 24 | 0 | 4 | 20 | 0 |
| 9 | JjScript Scripting | 2 | 23 | 0 | 5 | 18 | 0 |
| 10 | JjEL Expression Language | 3 | 5 | 0 | 1 | 4 | 0 |
| 11 | Console (interactive) | 2 | 7 | 1 | 2 | 4 | 0 |
| 12 | Viewpoints & Workbench | 4 | 16 | 0 | 4 | 12 | 0 |
| 13 | Jjodie AI Assistant | 5 | 17 | 5 | 6 | 6 | 0 |
| 14 | Settings & Preferences | 6 | 32 | 8 | 6 | 18 | 0 |
| 15 | Help & Documentation | 3 | 17 | 11 | 3 | 3 | 0 |
| 16 | Visualization & Analytics | 3 | 22 | 1 | 7 | 14 | 0 |
| 17 | Environment Generation Wizard | 1 | 9 | 0 | 2 | 7 | 0 |
| 18 | Export / Import / File ops | 2 | 8 | 4 | 2 | 2 | 0 |
| 19 | Modals & Notifications System | 4 | 8 | 5 | 2 | 1 | 0 |
| 20 | Feature Palette & Bulk Actions | 2 | 8 | 3 | 2 | 3 | 0 |
| **TOTALE** | | **72** | **358** | **114** | **81** | **163** | **6** |

> Nota: i totali L3 includono anche feature `⚠️` non implementate (contate sia nel tier ipotetico che nel sub-totale ⚠️). Ricontare manualmente in fase di revisione.

---

## 1. Project Dashboard & Shell

Pagina di ingresso dell'app: catalogo progetti, bottoni di creazione, login. Wrapper layout per il workspace.

**File**: `src/pages/dashboard.tsx`, `src/pages/Project.tsx`, `src/pages/components/Dashboard.tsx`, `src/pages/components/LeftBar.tsx`

### Dashboard (catalogo progetti)

**File**: `src/pages/components/Dashboard.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Crea nuovo progetto | 🟢 | all | often | reversible | bottone "+ New Project" |
| Apri progetto recente | 🟢 | all | often | safe | click su card |
| Marca progetto come preferito | 🟢 | all | sometimes | safe | toggle stella |
| Cerca progetti | 🟢 | all | sometimes | safe | barra ricerca |
| Filtra per tag | 🟡 | all | sometimes | safe | dipende se tagging è user-facing per beginner |
| Cancella progetto | 🟢 | all | rarely | confirm | conferma dialog |

### LeftBar (sidebar di sezioni)

**File**: `src/pages/components/LeftBar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: safe
**Note**: navigazione tra sezioni del workspace (Models, Metamodels, Transformations, Viewpoints)

### Project (workspace wrapper)

**File**: `src/pages/Project.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Mostra schermata di caricamento progetto | 🟢 | all | always | safe | `ProjectLoadingScreen.tsx` |
| Auto-sync layout dock con tabs | 🟡 | all | always | safe | sync nascosto, semi-Advanced |

### ProjectEditor (orchestratore)

**File**: `src/components/project/ProjectEditor.tsx` (~121KB)
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: safe
**Note**: monolite che orchestra TreeView, EditorV2, RightPanel, dock, eventi globali. Non è L1 a sé — è il backbone delle aree 3-7.

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Apertura automatica di metamodelli/modelli precedenti | 🟢 | all | always | safe | restoring session |
| Listener eventi globali (export, polymetric, envgen, ...) | 🔴 | contributor | sometimes | safe | infrastruttura interna |
| Coordinamento save state | 🟢 | all | always | safe | tramite SaveManager |

---

## 2. Navbar & Menu globali

App bar con i menu principali (File, Edit, View, Tools, Analyze, Help, Jjodel) e pulsanti rapidi.

**File**: `src/pages/components/Navbar.tsx` (~90KB), `src/pages/components/navbar.scss`

### Menu File

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| New → Metamodel | 🟢 | all | often | reversible | shortcut Cmd+Shift+M |
| New → Model (per metamodello) | 🟢 | all | often | reversible | submenu |
| Recent Projects (max 20) | 🟢 | all | often | safe | |
| Import Project | 🟢 | all | sometimes | reversible | upload .jjodel |
| Save Project | 🟢 | all | always | safe | Cmd+S |
| Download Project | 🟢 | all | sometimes | safe | export .jjodel |
| Export Canvas → PNG | 🟡 | all | sometimes | safe | educators per slides |
| Export Canvas → JPEG | 🟡 | all | sometimes | safe | |
| Export Canvas → SVG | 🟡 | all | sometimes | safe | |
| Export Canvas → Copy to clipboard | 🟡 | all | sometimes | safe | |
| Close Project | 🟢 | all | often | confirm | prompt se unsaved |
| Delete Project | 🔴 ⚠️ | all | rarely | destructive | non implementato (placeholder) |

### Menu Edit

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Undo | 🟢 | all | always | reversible | Cmd+Z |
| Redo | 🟢 | all | always | reversible | Cmd+Shift+Z |
| Add to / Remove from Favorites | 🟢 | all | sometimes | safe | toggle preferiti |
| Copy Public Link | 🟡 ⚠️ | all | rarely | safe | non implementato |

### Menu View

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Switch to Advanced/Basic Mode | 🟢 | all | sometimes | safe | toggle progressive disclosure |
| Zoom In / Out / Reset | 🟢 | all | often | safe | Cmd+, Cmd-, Cmd0 |
| Save Layout (auto-save toggle) | 🔴 | researcher | rarely | safe | layout dock |
| Save Layout (manual save) | 🔴 | researcher | rarely | safe | |
| Load Layout → Default | 🟡 | all | sometimes | reversible | |
| Load Layout → Project layouts 1-3 | 🔴 | researcher | rarely | reversible | |
| Load Layout → User layouts 1-3 | 🔴 | researcher | rarely | reversible | |
| Show/Hide Sidebar | 🟢 ⚠️ | all | sometimes | safe | non implementato |
| Show/Hide Toolbar | 🟢 ⚠️ | all | sometimes | safe | non implementato |
| Fullscreen Mode | 🟢 | all | sometimes | safe | F11 |
| Show singleton instances | 🔴 | researcher | rarely | safe | toggle tree |
| Debug Mode | 🔴 | contributor | rarely | safe | solo Advanced visibility |
| Show Console | 🔴 | researcher | sometimes | safe | apre JjScript console |

### Menu Tools

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟡
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Metamodel Tools (per metamodello) | 🔴 ⚠️ | researcher | sometimes | safe | non implementato |
| Custom Tools | 🔴 ⚠️ | contributor | rarely | safe | non implementato |
| Generate Environment | 🔴 | researcher | rarely | reversible | apre wizard EnvGen |
| Polymetric View (beta) | 🔴 | researcher | rarely | safe | apre vista polymetric |

### Menu Analyze (visibile solo in Advanced)

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Live Validation | 🔴 ⚠️ | researcher | sometimes | safe | non implementato |
| Validate (one-shot) | 🔴 ⚠️ | researcher | sometimes | safe | non implementato |
| M2 Analytics | 🔴 | researcher | rarely | safe | metriche metamodello |
| Debug loops | 🔴 | contributor | rarely | safe | transaction debugger |
| Check integrity | 🔴 | contributor | rarely | reversible | autocorrect via VersionFixer |

### Menu Help

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Keyboard Shortcuts | 🟢 | all | sometimes | safe | apre ShortcutsReference |
| What's New in Jjodel | 🟡 | all | rarely | safe | GitHub releases |
| Homepage | 🟢 | all | rarely | safe | jjodel.io |
| Learn Jjodel | 🟢 | student | rarely | safe | docs.jjodel.io |
| Getting Started | 🟢 | student | rarely | safe | quickstart |
| Video Tutorials | 🟢 | student | rarely | safe | video pills |
| User Guide | 🟢 | all | rarely | safe | |
| Glossary | 🟡 | student | rarely | safe | |
| FAQ | 🟢 | all | rarely | safe | |
| Report a Bug | 🟡 | all | rarely | safe | GitHub issue |
| Request a Feature | 🟡 | all | rarely | safe | GitHub issue |
| Contact | 🟢 | all | rarely | safe | mailto |

### Menu Jjodel (brand)

**File**: `src/pages/components/Navbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: rarely
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| About Jjodel | 🟢 | all | rarely | safe | dialog credit |
| Roadmap | 🟡 | all | rarely | safe | GitHub milestones |
| Sign-out | 🟢 | all | sometimes | confirm | prompt unsaved |

---

## 3. Dock / Layout System

Sistema di tab e pannelli (rc-dock). Le feature dei singoli tab sono documentate sotto le aree di pertinenza.

**File**: `src/components/abstract/Dock.tsx`, `DockManager.ts`, `DockLayout.tsx`, `MyRcDock.tsx`, `tabs/TabDataMaker.tsx`

### Tab system (pointer)

**File**: `src/components/abstract/DockManager.ts`
**Tier**: 🟢 Basic (infrastruttura, presenza è essenziale)
**Audience**: all
**Frequenza**: always
**Rischio**: safe

| Tab | Punta a | Note |
|-----|---------|------|
| M2 / Metamodel tab | [§ 4 Metamodel & Model Editor](#4-metamodel--model-editor-v2) | tab principale per editing M2 |
| M1 / Model tab | [§ 4 Metamodel & Model Editor](#4-metamodel--model-editor-v2) | tab per istanze, viewpoint optional |
| Transformation tab | [§ 8 JjTL Transformation Editor](#8-jjtl-transformation-editor) | jjtl_* prefix |
| Documentation tab | [§ 15 Help & Documentation](#15-help--documentation) | doc_* prefix |
| Project Summary tab | [§ 7 Right Panel (Activity)](#7-right-panel-activity) | DockComponent_rightbar_* prefix |
| Viewpoint tab (legacy) | [§ 12 Viewpoints & Workbench](#12-viewpoints--workbench) | vp_* prefix; ora editing inline in right panel |

### Layout management

**File**: `src/components/abstract/Dock.tsx`
**Tier**: 🟡
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Drag tab per riposizionare | 🟢 | all | sometimes | safe | rc-dock built-in |
| Split tab orizzontale/verticale | 🟡 | researcher | sometimes | safe | drag su edge |
| Pin tab | 🔴 | researcher | rarely | safe | layout salvabile |
| Close tab (×) | 🟢 | all | often | safe | invoca DockManager.closeTab |
| Overflow menu (tab nascosti oltre 6) | 🟢 | all | sometimes | safe | |
| Toggle layout-mode canvas-only | 🟡 | researcher | sometimes | safe | nasconde pannelli laterali |

---

## 4. Metamodel & Model Editor (V2)

Editor visuale principale (React Flow). Crea/modifica metamodelli (classi, attributi, references) e modelli istanze.

**File**: `src/components/editor-v2/EditorV2.tsx` (~131KB), `Toolbar.tsx`, `AlignmentToolbar.tsx`, `ContextMenu.tsx`, `nodes/`, `edges/`, `hooks/`, `panels/`

### Toolbar (azioni gruppo sinistro)

**File**: `src/components/editor-v2/Toolbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Undo | 🟢 | all | always | reversible | Cmd+Z |
| Redo | 🟢 | all | always | reversible | Cmd+Shift+Z |
| Duplicate selected | 🟢 | all | often | reversible | copia elementi |
| Delete selected | 🟢 | all | often | confirm | Delete/Backspace |

### Toolbar (alignment, swap su 2+ selezionati)

**File**: `src/components/editor-v2/AlignmentToolbar.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Align left / center-V / right | 🟢 | all | sometimes | safe | bottoni icona |
| Align top / center-H / bottom | 🟢 | all | sometimes | safe | |
| Distribute H | 🟡 | all | rarely | safe | richiede 3+ |
| Distribute V | 🟡 | all | rarely | safe | richiede 3+ |

### Toolbar (view & layout)

**File**: `src/components/editor-v2/Toolbar.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Notation selector (Structured / Simplified / Compact / Wireframe / ER) | 🟡 | all | sometimes | safe | dropdown modi notazione |
| Color scheme selector | 🟡 | all | sometimes | safe | tema visuale |
| Toggle dot grid | 🟢 | all | sometimes | safe | |
| Toggle snap-to-grid | 🟢 | all | sometimes | safe | |
| Auto layout | 🟡 | all | sometimes | reversible | algoritmo automatico |

### Toolbar (viewpoint & editor mode, solo modelli)

**File**: `src/components/editor-v2/Toolbar.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Viewpoint selector (None / list) | 🔴 | researcher | sometimes | safe | dropdown |
| Syntax pill (abstract vs concrete) | 🔴 | researcher | sometimes | safe | indicatore read-only |
| Editor mode → Flow (abstract syntax) | 🟡 | all | sometimes | safe | |
| Editor mode → Classic (concrete syntax) | 🔴 | researcher | sometimes | safe | richiede viewpoint |
| Editor mode → Split | 🔴 | researcher | rarely | safe | abstract+concrete |

### Toolbar (zoom & panel)

**File**: `src/components/editor-v2/Toolbar.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Zoom out | 🟢 | all | often | safe | |
| Zoom level (click per reset) | 🟢 | all | sometimes | safe | |
| Zoom in | 🟢 | all | often | safe | |
| Fit to view | 🟢 | all | often | safe | |
| Toggle fullscreen / show panel | 🟡 | all | sometimes | safe | layout-mode toggle |

### Canvas interactions (React Flow)

**File**: `src/components/editor-v2/EditorV2.tsx`, `hooks/`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Drag node to reposition | 🟢 | all | often | reversible | |
| Pan canvas | 🟢 | all | often | safe | middle-click drag o spazio |
| Connect nodes (drag edge handle) | 🟢 | all | often | reversible | crea reference/inheritance |
| Select multiple (drag rectangle) | 🟢 | all | often | safe | |
| Right-click context menu | 🟢 | all | often | varies | dipende da voce |
| Drag-drop da Feature Palette | 🟢 | all | often | reversible | crea elemento |

---

## 5. Properties Panel

Pannello laterale destro per editare proprietà dell'elemento selezionato.

**File**: `src/components/editor-v2/panels/PropertiesPanel.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: misto

### Class Node properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit name | 🟢 | all | often | reversible | text input |
| Toggle abstract | 🟢 | all | sometimes | reversible | checkbox |
| Toggle interface | 🟡 | researcher | sometimes | reversible | concetto MDE |
| Toggle allow cross-extend | 🔴 | researcher | rarely | reversible | concetto avanzato |
| Toggle final | 🟡 | researcher | sometimes | reversible | |
| Toggle singleton | 🔴 | researcher | rarely | reversible | |
| Toggle rootable | 🔴 | researcher | rarely | reversible | concetto Jjodel-specifico |
| Toggle partial | 🔴 | researcher | rarely | reversible | |
| Duplicate node | 🟢 | all | sometimes | reversible | |
| Delete node | 🟢 | all | sometimes | confirm | |

### Attributi della classe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Add attribute | 🟢 | all | often | reversible | bottone + |
| Edit attribute name | 🟢 | all | often | reversible | text input |
| Select attribute type | 🟢 | all | often | reversible | dropdown |
| Remove attribute | 🟢 | all | sometimes | confirm | bottone X |

### References della classe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Add reference | 🟢 | all | often | reversible | bottone + |
| Edit reference name | 🟢 | all | often | reversible | text input |
| Select target class | 🟢 | all | often | reversible | dropdown |
| Remove reference | 🟢 | all | sometimes | confirm | bottone X |

### Operations della classe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Add operation | 🔴 | researcher | rarely | reversible | concetto raro nei tutorial |
| Edit operation name | 🔴 | researcher | rarely | reversible | |
| Select return type | 🔴 | researcher | rarely | reversible | |
| Remove operation | 🔴 | researcher | rarely | confirm | |

### Enum Node properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit enum name | 🟢 | all | sometimes | reversible | |
| Add literal | 🟢 | all | sometimes | reversible | bottone + |
| Edit literal name | 🟢 | all | sometimes | reversible | |
| Remove literal | 🟢 | all | sometimes | confirm | |

### Package Node properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit package name | 🟡 | all | sometimes | reversible | packages = ambiguous per beginner |

### Reference Edge properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit reference name | 🟢 | all | often | reversible | |
| Convert to inheritance | 🟡 | researcher | sometimes | reversible | |
| Reference kind: association/composition/aggregation | 🟡 | researcher | sometimes | reversible | concetto MDE |
| Set lower bound (multiplicity) | 🟢 | all | often | reversible | number input |
| Set upper bound (multiplicity) | 🟢 | all | often | reversible | number input |
| Delete edge | 🟢 | all | sometimes | confirm | |

### Inheritance Edge properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Convert to reference | 🟡 | researcher | sometimes | reversible | |
| Configure source anchor (side + mode) | 🔴 | researcher | rarely | safe | controllo posizionamento |
| Configure target anchor (side + mode) | 🔴 | researcher | rarely | safe | |
| Delete edge | 🟢 | all | sometimes | confirm | |

### Model/Metamodel root properties

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit model name | 🟢 | all | sometimes | reversible | |
| Edit URI | 🟡 | researcher | sometimes | reversible | URI tecnico |
| View overview stats | 🟢 | all | sometimes | safe | read-only counts |

---

## 6. Tree View Sidebar

Browser gerarchico del progetto/metamodello/modello.

**File**: `src/components/TreeViewSidebar/TreeViewSidebar.tsx`, `TreeViewContent.tsx` (~55KB)

### Tree navigation

**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: always
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Click su nodo per selezionare | 🟢 | all | always | safe | sync con editor |
| Espandi/collassa nodo (chevron) | 🟢 | all | often | safe | |
| Auto-expand on highlight | 🟢 | all | often | safe | |
| Toggle tree view (Cmd+B) | 🟢 | all | sometimes | safe | nasconde sidebar |

### Tree context menu (right-click su classifier)

**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Add view to workbench (per classifiers) | 🔴 | researcher | rarely | reversible | apre viewpoint workbench |
| Espandi e seleziona | 🟢 | all | often | safe | sync con canvas |
| Apri editor per double-click | 🟢 | all | often | safe | apre nuovo tab |
| Escape per chiudere context menu | 🟢 | all | sometimes | safe | |

---

## 7. Right Panel (Activity)

Pannello destro: statistiche progetto, attività recenti, quick actions.

**File**: `src/pages/components/RightPanel/RightPanel.tsx`, `ActivityItem.tsx`, `GroupedActivityItem.tsx`, `StatCard.tsx`, `QuickActionButton.tsx`

### Overview / stat cards

**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Card "Total projects" (clickable) | 🟢 | all | sometimes | safe | naviga a dashboard |
| Card "Favorites count" | 🟢 | all | sometimes | safe | |
| Card "Modified today" | 🟢 | all | sometimes | safe | |
| Card "Account settings" | 🟢 | all | sometimes | safe | apre Settings |

### Quick Actions

**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| New Project | 🟢 | all | often | reversible | |
| User Manual link | 🟢 | student | rarely | safe | |
| Documentation link | 🟢 | all | rarely | safe | |

### Activity Timeline

**Tier**: 🟡
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Activities raggruppate per periodo | 🟢 | all | often | safe | |
| Espandi gruppo | 🟢 | all | sometimes | safe | |
| Scroll to top button | 🟢 | all | sometimes | safe | |
| Load more activities | 🟡 | all | sometimes | safe | paginazione |

---

## 8. JjTL Transformation Editor

Editor e runtime per il linguaggio di trasformazione model-to-model. Tutta l'area è 🔴 Advanced (richiede conoscenza MDE).

**File**: `src/jjtl/` — `editor/`, `executor/`, `components/`, `views/`, `parser/`, `lexer/`, `services/`, `types/`
**Spec**: `src/jjtl/SPEC.md`

### JjtlToolbar

**File**: `src/jjtl/components/JjtlToolbar.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Source metamodel selector | 🔴 | researcher | sometimes | safe | |
| Target metamodel selector | 🔴 | researcher | sometimes | safe | |
| Validate transformation | 🔴 | researcher | often | safe | parser + semantic |
| Format code (Shift+F) | 🔴 | researcher | sometimes | reversible | |
| Execute transformation (Enter) | 🔴 | researcher | often | reversible | apre dialog |
| Settings | 🔴 | researcher | rarely | safe | preferenze AI |

### JjtlEditor (Monaco)

**File**: `src/jjtl/editor/`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: often
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Syntax highlighting JjTL | 🔴 | researcher | always | safe | tema dedicato |
| Autocomplete builtins | 🔴 | researcher | often | safe | |
| Hover tooltips | 🔴 | researcher | sometimes | safe | |

### ExecuteTransformationDialog

**File**: `src/jjtl/components/ExecuteTransformationDialog.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Select source model (filtrato per metamodel name) | 🔴 | researcher | sometimes | safe | |
| Set output model name | 🔴 | researcher | sometimes | safe | check duplicati |
| Execute | 🔴 | researcher | sometimes | reversible | crea nuovo model |
| Cancel (Escape) | 🟡 | all | sometimes | safe | |

### NewTransformationDialog

**File**: `src/jjtl/components/NewTransformationDialog.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Set transformation name | 🔴 | researcher | rarely | safe | |
| Select source metamodel | 🔴 | researcher | rarely | safe | |
| Select target metamodel | 🔴 | researcher | rarely | safe | |
| Create | 🔴 | researcher | rarely | reversible | apre nuovo tab JjTL |

### Mapping suggestions panel

**File**: `src/jjtl/views/SuggestedMappingsPanel.tsx`, `MappingCard.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Toggle modalità Simple (heuristic) | 🔴 | researcher | sometimes | safe | |
| Toggle modalità AI (LLM) | 🔴 | researcher | sometimes | safe | richiede provider |
| ☑ Insert mapping into editor | 🔴 | researcher | sometimes | reversible | |
| ☐ Pending suggestion | 🔴 | researcher | sometimes | safe | |
| ✕ Reject suggestion | 🔴 | researcher | sometimes | safe | |
| Mapping analysis progress modal | 🟡 | researcher | sometimes | safe | progress AI breakdown |

### Views diagnostiche & ausiliarie

**File**: `src/jjtl/views/DualMetamodelPanel.tsx`, `MetamodelTreeView.tsx`, `MappingLinesOverlay.tsx`, `ProblemsPanel.tsx`, `GrammarTab.tsx`, `MappingTraceView.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| DualMetamodelPanel (side-by-side) | 🔴 | researcher | sometimes | safe | source vs target tree |
| MetamodelTreeView (hierarchical) | 🔴 | researcher | sometimes | safe | |
| MappingLinesOverlay (visual arrows) | 🟡 | researcher | sometimes | safe | hover-based |
| ProblemsPanel (parse errors) | 🔴 | researcher | often | safe | |
| GrammarTab (railroad EBNF) | 🔴 | researcher | rarely | safe | docs visiva |
| MappingTraceView | 🔴 | researcher | rarely | safe | trace model |

---

## 9. JjScript Scripting

Linguaggio imperativo per manipolazione metamodelli, eseguito da console o ScriptBlock.

**File**: `src/jjscript/` — `parser/`, `executor/commands/`, `components/`, `services/`, `autocomplete/`, `recovery/`, `normalizer/`

### JjScript Console (UI)

**File**: `src/jjscript/components/JjScriptConsole.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Input field (esegui comando) | 🔴 | researcher | sometimes | varies | dipende dal comando |
| Clear console | 🟢 | all | sometimes | safe | |
| Help command | 🟢 | all | sometimes | safe | mostra reference |

### JjScript Commands (20)

**File**: `src/jjscript/executor/commands/`
**Tier**: 🔴 Advanced (l'intera categoria)
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto

| Comando | Tier | Audience | Frequenza | Rischio | Note |
|---------|------|----------|-----------|---------|------|
| `create` | 🔴 | researcher | often | reversible | nuovo elemento |
| `add` | 🔴 | researcher | often | reversible | wrapper di create |
| `delete` | 🔴 | researcher | sometimes | destructive | rimuove definitivamente |
| `remove` | 🔴 | researcher | sometimes | reversible | rimuove da collezione |
| `rename` | 🔴 | researcher | often | reversible | |
| `move` | 🔴 | researcher | sometimes | reversible | cambia parent |
| `copy` | 🔴 | researcher | sometimes | reversible | duplica con deep opt |
| `set` | 🔴 | researcher | often | reversible | property assignment |
| `extends` | 🔴 | researcher | sometimes | reversible | shorthand inheritance |
| `abstract` | 🔴 | researcher | sometimes | reversible | toggle flag |
| `forall` | 🔴 | researcher | sometimes | varies | itera collezione |
| `let` | 🔴 | researcher | sometimes | safe | scoped binding |
| `eval` | 🔴 | researcher | sometimes | safe | valuta JjEL |
| `list` | 🔴 | researcher | often | safe | filtro elementi |
| `show` | 🔴 | researcher | sometimes | safe | dettaglio elemento |
| `validate` | 🔴 | researcher | sometimes | safe | check struttura |
| `help` | 🟢 | all | sometimes | safe | reference comandi |
| `clear` | 🟢 | all | sometimes | safe | |
| `undo` (in console) | 🟡 | researcher | sometimes | reversible | |
| `redo` (in console) | 🟡 | researcher | sometimes | reversible | |

### ScriptBlock components

**File**: `src/jjscript/components/ScriptBlock.tsx`, `ScriptExecutionWindow.tsx`, `ExecutionErrorDialog.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto
**Note**: usato in flussi Jjodie per script generati da AI

---

## 10. JjEL Expression Language

Motore di espressioni puro. Esposto in console, JjTL mappings, properties (conversion fields).

**File**: `src/jjel/` — `lexer/`, `parser/`, `evaluator/evaluator.ts`, `evaluator/context.ts`, `evaluator/builtins/`
**Spec**: `src/jjel/SPEC.md`

### JjEL Editor experience

**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe (espressioni pure)

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Inserisci espressione in console | 🔴 | researcher | sometimes | safe | |
| Inserisci espressione in JjTL mapping | 🔴 | researcher | often | safe | conversion field |
| Inserisci espressione in guard `where` | 🔴 | researcher | sometimes | safe | filtro JjTL |

### JjEL Built-ins (raggruppati)

**File**: `src/jjel/evaluator/builtins/`
**Tier**: 🔴 Advanced (uso da espressioni)
**Audience**: researcher
**Frequenza**: often
**Rischio**: safe

| Categoria | Tier | Audience | Frequenza | Rischio | Note |
|-----------|------|----------|-----------|---------|------|
| Built-ins (~100 metodi: strings 35+, collections 30+, numbers 35+, dates 20+) | 🔴 | researcher | often | safe | nessuna distinzione common/advanced nel codice — 1 sola riga |

### Linguaggio constructs (sintassi user-facing)

**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: often
**Rischio**: safe

| Costrutto | Tier | Note |
|-----------|------|------|
| Member access, null-safe, method call | 🟡 | dipende da audience: pattern OO familiari |
| `forall x in S [: proj]`, `exists x in S \| pred` | 🔴 | set comprehension |
| `with expr do body`, `if c then a else b` | 🔴 | |
| `??`, `implies`, lambda `=>` | 🔴 | |

---

## 11. Console (interactive)

Console interattivo dock-panel per JjEL e JjScript. Distinto dal `JjScriptConsole` standalone (vedi anche § 9).

**File**: `src/components/editors/Console/` — `ConsoleInput.tsx`, `ConsoleEntry.tsx`, `ConsoleHistory.tsx`, `ConsoleToolbar.tsx`, `LanguageToggle.tsx`, `HelpCommandOutput.tsx`, `CollapsibleContextKeys.tsx`, `CollapsibleJSONViewer.tsx`

### Console Toolbar

**File**: `src/components/editors/Console/ConsoleToolbar.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Clear console | 🟢 | all | sometimes | safe | |
| Copy all output | 🟡 | all | sometimes | safe | |
| Toggle language JjEL ↔ JjScript | 🔴 | researcher | sometimes | safe | |
| Show keyboard shortcuts | 🔴 | researcher | rarely | safe | |
| Display command history count | 🟡 | researcher | always | safe | read-only |

### Console output features

**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Collapsible JSON viewer | 🔴 | researcher | sometimes | safe | per output complessi |
| Collapsible context keys | 🔴 | researcher | sometimes | safe | introspezione context |

---

## 12. Viewpoints & Workbench

Definizione di viewpoint (predicates, styles, templates) per concrete syntax. Inline nel right-panel ("Viewpoints" tab) dopo rimozione Editor V3.

**File**: `src/components/editors/viewpoint/`, `src/view/viewPoint/`, `src/components/editors/views/`
**Stato**: Editor V3 rimosso 2026-04-06; flusso attivo via `WorkbenchCanvas` + `NestedView`

### View Tree

**File**: `src/components/editors/viewpoint/ViewTree.tsx`, `ViewTreeNode.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Add new view | 🔴 | researcher | sometimes | reversible | |
| Select view | 🔴 | researcher | often | safe | |
| View hierarchy display | 🔴 | researcher | sometimes | safe | nested |

### WorkbenchCanvas

**File**: `src/components/editors/viewpoint/WorkbenchCanvas.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: reversible
**Note**: canvas per disegnare layout view; integrato con WorkbenchEditors e WorkbenchProperties

### Inline Editors (WorkbenchEditors)

**File**: `src/components/editors/viewpoint/WorkbenchEditors.tsx`, `PredicateEditor.tsx`, `StyleEditor.tsx`, `TemplateEditor.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: often (durante editing viewpoint)
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| PredicateEditor: toggle language JS / OCL / JjEL | 🔴 | researcher | sometimes | safe | |
| PredicateEditor: edit code (Monaco) | 🔴 | researcher | often | reversible | |
| PredicateEditor: open fullscreen | 🟡 | researcher | sometimes | safe | |
| TemplateEditor: edit template (Monaco) | 🔴 | researcher | often | reversible | |
| TemplateEditor: open fullscreen | 🟡 | researcher | sometimes | safe | |
| StyleEditor: edit styling rules (Monaco) | 🔴 | researcher | often | reversible | |
| StyleEditor: open fullscreen | 🟡 | researcher | sometimes | safe | |
| Read-only mode per default views | 🔴 | researcher | sometimes | safe | non-expert mode |
| Auto-save on blur | 🔴 | researcher | always | reversible | |

### ViewpointBreadcrumb & properties

**File**: `src/components/editors/viewpoint/ViewpointBreadcrumb.tsx`, `properties/ViewpointProperties.tsx`, `ViewProperties.tsx`, `NodeProperties.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Breadcrumb navigation viewpoint → view → node | 🔴 | researcher | often | safe | |
| Edit viewpoint properties | 🔴 | researcher | sometimes | reversible | |
| Edit view properties | 🔴 | researcher | sometimes | reversible | |
| Edit node properties (in view) | 🔴 | researcher | sometimes | reversible | |

---

## 13. Jjodie AI Assistant

Assistente AI conversazionale sempre accessibile.

**File**: `src/components/Jodie/`, `src/jjodie-integration/`, `src/services/Jjodie*.ts`
**Componenti chiave**: `Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx`, `JodieMinimized.tsx`, `ChatInput.tsx`, `ChatMessages.tsx`

### Jodie Window UI

**Tier**: 🟡
**Audience**: all
**Frequenza**: often
**Rischio**: misto
**Note**: feature di scoperta — beginner potrebbero non sapere a cosa serve

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Open / close Jodie window | 🟢 | all | often | safe | trigger globale |
| Minimize Jodie | 🟢 | all | often | safe | |
| Resize window | 🟡 | all | sometimes | safe | |

### Chat interaction

**Tier**: 🟡
**Audience**: all
**Frequenza**: often
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Send chat message | 🟢 | all | often | safe | input text |
| View AI response (markdown rendering) | 🟢 | all | often | safe | EnhancedMarkdown |
| Clear chat history | 🟡 | all | sometimes | confirm | ClearConfirmationDialog |

### Action confirmation flow

**File**: `src/components/Jodie/ActionConfirmation.tsx`, `ActionSuggestion.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: often (durante AI flow)
**Rischio**: varies

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Confirm AI-suggested action | 🟢 | all | often | varies | dipende dall'azione |
| Reject AI-suggested action | 🟢 | all | often | safe | |
| Edit action before applying | 🔴 | researcher | sometimes | reversible | |

### Command palette

**File**: `src/components/Jodie/CommandPalette.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Open palette (shortcut) | 🟡 | all | sometimes | safe | discovery feature |
| Search command | 🟢 | all | sometimes | safe | |
| Execute slash-command | 🔴 | researcher | sometimes | varies | |

### Context-aware features

**File**: `src/components/Jodie/MetamodelOverview.tsx`, `MetamodelPreview.tsx`, `JjodieGreeting.tsx`, `JjodieWelcome.tsx`
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Welcome / greeting message (first session) | 🟢 | student | rarely | safe | onboarding |
| Metamodel overview (auto) | 🔴 | researcher | sometimes | safe | analisi AI |
| Metamodel preview card | 🔴 | researcher | sometimes | safe | |
| Provider selector inline (per query) | 🔴 | researcher | sometimes | safe | ProviderSelector |
| Settings shortcut (apre Settings → Providers) | 🟡 | researcher | rarely | safe | |

---

## 14. Settings & Preferences

Sistema unificato di settings (modal o drawer).

**File**: `src/components/Settings/UnifiedSettingsModal/`, `src/contexts/SettingsModalContext.tsx`, `src/components/GlobalDrawer/SettingsDrawerContent.tsx`, `src/pages/settings/`

### Profile section

**File**: `src/components/Settings/UnifiedSettingsModal/sections/ProfileSection.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: rarely
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit name | 🟢 | all | rarely | safe | |
| Edit surname | 🟢 | all | rarely | safe | |
| Edit nickname | 🟢 | all | rarely | safe | |
| Edit email | 🟢 | all | rarely | safe | |
| Edit affiliation | 🟢 | all | rarely | safe | |
| Select country | 🟢 | all | rarely | safe | |
| Toggle newsletter subscription | 🟢 | all | rarely | safe | |
| Avatar color picker | 🟢 | all | rarely | safe | |
| Avatar icon picker | 🟢 | all | rarely | safe | |

### Security section

**File**: `src/components/Settings/UnifiedSettingsModal/sections/SecuritySection.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: rarely
**Rischio**: confirm

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Change password (current + new + confirm) | 🟢 | all | rarely | confirm | |
| Show/hide password fields | 🟢 | all | rarely | safe | toggle visibility |
| View password strength indicator | 🟡 | all | rarely | safe | |

### Providers section (AI)

**File**: `src/components/Settings/UnifiedSettingsModal/sections/ProvidersSection.tsx`, `AISettingsContent.tsx`, `ProviderSettings.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: confirm

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Configure provider API key (OpenAI, Anthropic, DeepSeek, Mistral, Gemini, Groq, Kimi, Ollama, Local) | 🔴 | researcher | rarely | confirm | secret |
| Select default model per provider | 🔴 | researcher | rarely | safe | |
| Set per-feature provider preference (chat, documentation, mappings, scriptblock) | 🔴 | researcher | rarely | safe | |
| Test provider connection | 🟡 | researcher | rarely | safe | |
| Set global default provider | 🔴 | researcher | rarely | safe | |

### Prompts section

**File**: `src/components/Settings/UnifiedSettingsModal/sections/PromptsSection.tsx`, `PromptsSettingsSection.tsx`, `PromptEditor.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Edit prompt — chat | 🔴 | researcher | rarely | reversible | |
| Edit prompt — documentation | 🔴 | researcher | rarely | reversible | |
| Edit prompt — mappings | 🔴 | researcher | rarely | reversible | |
| Edit prompt — scriptblock | 🔴 | researcher | rarely | reversible | |
| Reset prompt to default | 🟡 | researcher | rarely | confirm | |

### Appearance section

**File**: `src/components/Settings/UnifiedSettingsModal/sections/AppearanceSection.tsx`, `src/pages/settings/AppearanceSettings.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: rarely
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Theme: light / dark / system | 🟢 | all | rarely | safe | |
| Font size adjustment | 🟡 | all | rarely | safe | accessibility |
| UI density selector | 🔴 | researcher | rarely | safe | compact / comfortable |
| Color scheme selection | 🟡 | all | rarely | safe | |

### Advanced section

**File**: `src/components/Settings/UnifiedSettingsModal/sections/AdvancedSection.tsx`, `src/pages/settings/AdvancedSettings.tsx`
**Tier**: 🔴 Advanced
**Audience**: contributor
**Frequenza**: rarely
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Debug toggles | 🔴 | contributor | rarely | safe | |
| Storage management (clear) | 🔴 | contributor | rarely | destructive | reset locale |
| Export config | 🔴 | contributor | rarely | safe | |
| Manage tokens | 🔴 | contributor | rarely | confirm | |
| ShortcutsSettings page | 🟡 | all | rarely | safe | reference + custom |
| AIAssistantSettings page | 🔴 | researcher | rarely | safe | |

---

## 15. Help & Documentation

Documentazione contestuale, drawer help, riferimento shortcut.

**File**: `src/components/HelpDrawer.tsx`, `src/components/ShortcutsReference.tsx`, `src/components/HelpButton.tsx`, `src/services/JjodieHelpSystem.ts`, `src/components/abstract/tabs/DocumentationTab.tsx`

### Help Drawer

**File**: `src/components/HelpDrawer.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Open via F1 / Fn+F1 (macOS) / Cmd+/ | 🟢 | all | sometimes | safe | capture phase listener |
| Close (Escape) | 🟢 | all | sometimes | safe | |
| Open in Docs (full URL) | 🟢 | all | rarely | safe | external |
| Help via Jjodie (contextual) | 🟡 | all | sometimes | safe | tramite JjodieHelpSystem |

### Shortcuts Reference

**File**: `src/components/ShortcutsReference.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: rarely
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Open via Cmd+Shift+? | 🟢 | all | rarely | safe | |
| Browse shortcut categories | 🟢 | all | rarely | safe | |

### Documentation Tab

**File**: `src/components/abstract/tabs/DocumentationTab.tsx` (~49KB)
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| View mode (rendered Markdown) | 🟢 | all | often | safe | |
| Edit mode (Monaco markdown) | 🟢 | all | sometimes | reversible | |
| Source mode (raw markdown) | 🔴 | researcher | rarely | safe | |
| Toggle view/edit/source mode | 🟢 | all | sometimes | safe | bottoni |
| Regenerate documentation con AI | 🔴 | researcher | sometimes | reversible | provider selector |
| Export to Markdown | 🟢 | all | rarely | safe | |
| Export to PDF | 🟡 | all | rarely | safe | |
| Confidence badge (0-100%) | 🟡 | all | always | safe | indicatore AI |
| Outdated indicator | 🟡 | all | sometimes | safe | quando progetto cambia |
| Protected sections (`@protected` markers) | 🔴 | researcher | rarely | safe | |
| Sintassi: headers, bold, italic, code, tables, lists, links, blockquotes | 🟢 | all | always | safe | |
| Markdown syntax highlighting | 🟢 | all | always | safe | |

---

## 16. Visualization & Analytics

Visualizzazioni avanzate del progetto: megamodel, polymetric, statistics.

### Megamodel View

**File**: `src/components/megamodel/MegamodelView.tsx`, `MegamodelNode.tsx`, `MegamodelContextMenu.tsx`, `MegamodelLayout.ts`
**Tier**: 🟡
**Audience**: researcher
**Frequenza**: sometimes
**Rischio**: misto
**Note**: utile come overview anche per beginner, ma concetto MDE

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Drag node per riposizionare | 🟢 | all | often | reversible | |
| Pan canvas | 🟢 | all | often | safe | |
| Zoom (scroll wheel) | 🟢 | all | often | safe | |
| Toggle grid dots | 🟡 | all | sometimes | safe | |
| Auto-arrange layout | 🟡 | researcher | sometimes | reversible | |
| Fit to view | 🟢 | all | sometimes | safe | |
| Spotlight mode (delayed click) | 🔴 | researcher | rarely | safe | |
| Double-click → apri in editor | 🟢 | all | often | safe | |
| Inline rename (F2) | 🟢 | all | sometimes | reversible | |
| Context menu: Open in editor | 🟢 | all | often | safe | |
| Context menu: Rename | 🟢 | all | sometimes | reversible | |
| Context menu: Duplicate | 🟢 | all | sometimes | reversible | |
| Context menu: Run transformation (per transf) | 🔴 | researcher | sometimes | reversible | |
| Context menu: Delete | 🟢 | all | sometimes | confirm | |
| Canvas context menu: New metamodel | 🟢 | all | sometimes | reversible | |
| Canvas context menu: New model | 🟢 | all | sometimes | reversible | |
| Canvas context menu: Import | 🟢 | all | sometimes | reversible | |
| Toggle edge type visibility (legend click) | 🔴 | researcher | rarely | safe | conformsTo, inputOf, outputOf, generatedBy, ... |

### Polymetric View

**File**: `src/components/polymetric/PolymetricView.tsx`, `PolymetricMappingEditor.tsx`, `polymetricLayouts.ts`, `polymetricMetrics.ts`, `polymetricViews.ts`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: safe
**Note**: marcato beta nel Tools menu

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Select target model/metamodel | 🔴 | researcher | rarely | safe | pills |
| Select predefined view | 🔴 | researcher | rarely | safe | tabs |
| Select user-saved preset | 🔴 | researcher | rarely | safe | |
| Delete preset | 🔴 | researcher | rarely | destructive | X button |
| Switch to custom mode | 🔴 | researcher | rarely | safe | |
| Edit metric mapping (width, height, color, posX, posY) | 🔴 | researcher | rarely | safe | |
| Save custom preset | 🔴 | researcher | rarely | safe | |
| Click node per selezionare | 🟢 | all | sometimes | safe | |
| View top elements ranking | 🟡 | researcher | rarely | safe | top 3 by metric sum |
| View "About this view" | 🟡 | researcher | rarely | safe | |
| View metric mapping table (read-only) | 🔴 | researcher | rarely | safe | |
| View color/size legends | 🔴 | researcher | rarely | safe | |
| View element count | 🔴 | researcher | rarely | safe | |
| Subsampled warning (>500 nodes) | 🟡 | researcher | rarely | safe | indicatore performance |
| Close view | 🟢 | all | rarely | safe | |

### Metrics

**File**: `src/components/metrics/Metrics.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: safe
**Note**: per `todo_others`, è "largely placeholder"

---

## 17. Environment Generation Wizard

Wizard multi-step per generare ambienti/template di progetto, AI-assisted.

**File**: `src/components/envgen/EnvGenWizardModal.tsx`, `steps/`, `services/`, `hooks/`, `types.ts`

### Wizard Steps

**File**: `src/components/envgen/EnvGenWizardModal.tsx`
**Tier**: 🔴 Advanced
**Audience**: researcher
**Frequenza**: rarely
**Rischio**: reversible

| Step / Azione | Tier | Audience | Frequenza | Rischio | Note |
|---------------|------|----------|-----------|---------|------|
| Step 1 — General: select metamodel + nome | 🔴 | researcher | rarely | safe | |
| Step 2 — Tech Stack: select stack options | 🔴 | researcher | rarely | safe | |
| Step 3 — Design: configure design preferences | 🔴 | researcher | rarely | safe | |
| Step 4 — Features: select features | 🔴 | researcher | rarely | safe | |
| Step 5 — Concrete Syntax: configure | 🔴 | researcher | rarely | safe | |
| Step 6 — Output: select AI provider + view prompt | 🔴 | researcher | rarely | reversible | |
| Back button | 🟡 | all | rarely | safe | |
| Next button | 🟡 | all | rarely | safe | |
| Export Prompt | 🔴 | researcher | rarely | safe | save senza generare |
| Generate (azione finale) | 🔴 | researcher | rarely | reversible | invoca AI |

---

## 18. Export / Import / File Operations

Funzionalità di import/export multi-formato.

**File**: `src/services/export/EcoreService.ts`, `XMIService.ts`, `src/components/export/ExportImageMenu.tsx`, `src/components/forEndUser/ExportImportMenu.tsx`, `ImportDropZone.tsx`, `CanvasExportService.ts`

### Canvas / immagine

**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Export canvas → PNG | 🟢 | all | sometimes | safe | educators per slides |
| Export canvas → JPEG | 🟡 | all | sometimes | safe | |
| Export canvas → SVG | 🟡 | researcher | sometimes | safe | |
| Copy canvas to clipboard | 🟢 | all | sometimes | safe | |

### Project / Metamodel format

**Tier**: 🟡
**Audience**: all
**Frequenza**: rarely
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Import .jjodel project (drag-drop) | 🟢 | all | sometimes | reversible | |
| Download .jjodel project | 🟢 | all | sometimes | safe | |
| Export Ecore | 🔴 | researcher | rarely | safe | EcoreService |
| Export XMI | 🔴 | researcher | rarely | safe | XMIService |

---

## 19. Modals & Notifications System

Infrastruttura globale modali, drawer, conferme, toast.

**File**: `src/components/alert/`, `src/components/ErrorModal/`, `src/components/ConfirmDialog/`, `src/components/Toast/`, `src/components/WelcomeModal/`, `src/components/GlobalDrawer/`, `src/components/NotificationWidget/`, `src/components/AddTagDialog/`, `src/components/ExplainModal.tsx`, `src/components/CreateProjectDialog/`, `src/components/BrowserWarningModal/`

### Welcome / Onboarding

**File**: `src/components/WelcomeModal/`
**Tier**: 🟢 Basic
**Audience**: student
**Frequenza**: rarely (one-shot)
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Welcome modal (first-time user) | 🟢 | student | rarely | safe | onboarding |
| Browser warning modal | 🟢 | all | rarely | safe | check browser support |

### Confirms & Alerts

**File**: `src/components/ConfirmDialog/`, `src/components/alert/`, `src/components/ErrorModal/`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Confirm dialog (Are you sure?) | 🟢 | all | often | safe | infrastruttura |
| Error modal (recoverable error) | 🟢 | all | sometimes | safe | |
| Alert / non-bloccante | 🟢 | all | sometimes | safe | |

### Toast & Notifications

**File**: `src/components/Toast/`, `src/components/NotificationWidget.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: safe

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Toast notification (auto-dismiss) | 🟢 | all | often | safe | |
| Notification widget (badge) | 🟡 | all | sometimes | safe | |

### Specialized dialogs

**File**: vari
**Tier**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| AddTagDialog | 🟡 | all | sometimes | reversible | tagging progetti |
| CreateProjectDialog | 🟢 | all | often | reversible | new project |
| ExplainModal (AI explain popover) | 🔴 | researcher | sometimes | safe | |

---

## 20. Feature Palette & Bulk Actions

Sidebar di feature draggable + barra bulk per operazioni multiple.

**File**: `src/components/FeaturesPalette/`, `src/components/BulkActionsBar/`, `src/components/commandbar/CommandBar.tsx`, `src/components/GlobalSearch/`

### Feature Palette (drag-drop sidebar)

**File**: `src/components/FeaturesPalette.tsx`
**Tier**: 🟢 Basic
**Audience**: all
**Frequenza**: often
**Rischio**: reversible

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Drag Package onto canvas | 🟡 | researcher | often | reversible | concetto package |
| Drag Class onto canvas | 🟢 | all | often | reversible | |
| Drag Attribute onto canvas | 🟢 | all | often | reversible | (via class) |
| Drag Reference onto canvas | 🟢 | all | often | reversible | |
| Drag Operation onto canvas | 🔴 | researcher | sometimes | reversible | |
| Drag Enumerator onto canvas | 🟡 | researcher | sometimes | reversible | |
| Drag Literal onto canvas | 🟡 | researcher | sometimes | reversible | (su enum) |

### CommandBar / GlobalSearch / Bulk

**File**: `src/components/commandbar/CommandBar.tsx`, `src/components/GlobalSearch/`, `src/components/BulkActionsBar/`
**Tier**: 🟡
**Audience**: all
**Frequenza**: sometimes
**Rischio**: misto

| Azione | Tier | Audience | Frequenza | Rischio | Note |
|--------|------|----------|-----------|---------|------|
| Command palette (Cmd+K?) | 🟡 | all | sometimes | safe | discovery tool |
| Global search | 🟡 | all | sometimes | safe | workspace-wide |
| Bulk actions bar (su selezione multipla) | 🔴 | researcher | sometimes | varies | depends |

---

## Infrastruttura (no tier)

> Moduli non user-facing: data layer, Redux, service interni, utility, low-level rendering.
> Documentati per mappa tecnica, non classificati per progressive disclosure.

| Modulo | Path | Descrizione |
|--------|------|-------------|
| Joiner core | `src/joiner/` | LPointerTargetable, classes.ts, proxy.ts (LModel logic layer), components.tsx |
| Redux store | `src/redux/` | store.tsx, action/, reducer/, selectors/, defaults/ |
| Data model | `src/model/classes/`, `src/model/dataStructure/`, `src/model/logicWrapper/`, `src/model/conformance/` | DModel, DObject, DClass; conformance checking |
| Megamodel runtime | `src/model/megamodel.ts`, `megamodelInference.ts`, `megamodelPersistence.ts`, `megamodelRuntime.ts` | logic dietro alla megamodel view |
| Graph layer | `src/graph/` (graph/, graphElement/, vertex/, damedges/) | infrastruttura spaziale per rendering |
| Events registry | `src/events/registry.ts` | costanti tipizzate per ~38 eventi custom |
| Custom contexts | `src/contexts/` (DevModeContext, FeaturesPanelContext, GlobalDrawerContext, TreeViewPanelContext, SettingsModalContext) | UI-state non-Redux |
| API layer | `src/api/` | ProjectsApi, AuthApi |
| Router | `src/router/` | route minimali (`/`, `/project`, `/auth`) |
| Services (AI) | `src/services/AIProviderService.ts`, `JjodieRagService.ts`, `JjodieActionExecutor.ts`, `JjodieCommandParser.ts`, `JjodieHelpSystem.ts`, `DocumentationGenerator.ts`, `PromptService.ts`, `AIProviderPreferences.ts` | logic AI assistant |
| Services (utility) | `src/services/ActivityLogger.ts`, `ThemeService.ts`, `storage/` (activity storage local/backend) | logging, theming, storage |
| Hooks | `src/hooks/` (useAIProviderPreference, usePrompt, useResizableConsole, useToast, useInterfaceMode, useAvatar, useCanvasExport, useHelpResolver, useRecentActivities) | infrastruttura React |
| Common utilities | `src/common/` (U.tsx 182KB, UX.tsx, Geom.ts 65KB, Log.ts, SimpleTree.ts, Defaults.ts, Dummy.ts/Dummy.tsx, DV.tsx 73KB) | utility heavy; candidate refactoring (vedi note) |
| Utils | `src/utils/` | helper minori |
| WebSockets | `src/webSockets/` | infrastruttura collaborativa (uso non confermato) |
| jjodie-integration | `src/jjodie-integration/JjodieAPIImpl.ts` | bridge Jjodie ↔ Jjodel API |
| jjtl services | `src/jjtl/services/` (grammar, analyzer, executor utilities) | supporto JjTL editor |
| jjtl runtime core | `src/jjtl/lexer/`, `parser/`, `executor/executor.ts`, `executor/astBridge.ts` | parsing + execution |
| jjel runtime core | `src/jjel/lexer/`, `parser/`, `evaluator/evaluator.ts`, `evaluator/context.ts` | evaluation engine |
| jjscript runtime | `src/jjscript/parser/`, `executor/`, `services/`, `autocomplete/`, `recovery/`, `normalizer/` | parsing + execution + recovery |
| Save infrastructure | `src/components/topbar/SaveManager.ts`, `src/components/topbar/undoredocomponent.tsx` | tracking state, undo/redo wiring |
| Settings infrastructure | `src/settings/` | initial config |
| Constants | `src/constants/defaultPrompts.ts`, `documentTypes.ts` | dati statici di configurazione |

---

## Note per la revisione

### Feature sospette

- **Properties display triplo**: `editor-v2/panels/PropertiesPanel.tsx`, `editors/Info.tsx`, `editors/viewpoint/properties/{Viewpoint,View,Node}Properties.tsx`. Sembrano coesistere ma non è chiaro chi è il "default" — possibile sovrapposizione o uno è obsoleto. Da verificare manualmente quale viene effettivamente renderizzato in quali contesti.
- **Console doppia**: `components/editors/Console/` (interactive dock) vs `jjscript/components/JjScriptConsole.tsx`. Potrebbero essere lo stesso console riutilizzato o due componenti distinti — da consolidare.
- **Error display frammentato**: 4 percorsi di errore (`components/alert/ErrorModal.tsx`, `components/ErrorModal/`, `jjscript/components/ExecutionErrorDialog.tsx`, `Toast`). Stessa preoccupazione: possibile duplicazione, candidato a unificazione.
- **Export/Import sparso**: `services/export/`, `components/export/ExportImageMenu.tsx`, `components/forEndUser/ExportImportMenu.tsx`. Tre directory diverse per lo stesso dominio.
- **Documentation generation**: 3 entry point (DocumentationTab, Jjodie, DocumentationGenerator service). Quale è canonical?
- **`Navbar.tsx` (90KB)**: file monolitico che mescola menu File/Edit/View/Tools/Analyze/Help/Jjodel + status bar. Candidato a split.
- **`U.tsx` (182KB), `DV.tsx` (73KB), `Dummy.ts/Dummy.tsx` (43+74KB)**: utility files monolitici di scopo poco chiaro — segnalati anche in CLAUDE.md.
- **`Metrics.tsx`**: secondo `todo_others`, è "largely placeholders". Visibile via Analyze menu come "M2 Analytics" ma probabilmente stub.
- **`BottomToolbar.tsx`**: tutti i bottoni `disabled` (placeholder). Inclusa nell'inventario solo come riferimento futuro.

### Feature non user-facing emerse per errore

- **Debug Mode** (Navbar > View > Debug Mode): visibile solo in Advanced mode, ma toggla `transactionDebugger` — feature interna esposta in menu user-facing. Da nascondere a non-contributor o spostare sotto Settings → Advanced.
- **Save/Load Layout 1-3 (project + user)**: 6 slot di salvataggio layout dock; semantica non chiara per l'utente comune. Possibile feature contributor-only.
- **Check integrity** (Analyze menu): chiama `VersionFixer.autocorrect()` — operazione di rescue tecnico, candidata a Settings → Advanced anziché menu top.
- **PermissionModelTab.tsx**: importato in `Dock.tsx` ma mai creato via `TabDataMaker`. Sospetto orfano.
- **EditorSwitch.tsx** (`src/components/abstract/tabs/`): toggle tra EditorV2 e "alternate views" non chiare — possibile residuo dell'epoca pre-EditorV2.

### Gap rispetto ai docs

> I docs di sessione (`docs/handover/`, `docs/redesign/`, `docs/ai-agents/`) non sono accessibili per analisi automatica. La verifica gap richiede revisione manuale incrociata con `jjodel-docs` (separate repo).

Indicatori parziali da CLAUDE.md:
- **JjTL**: parsing avanzato di reference mapping, multiplicity enforcement, interactive statements (alert/notify/prompt) **menzionati come "parsed ma non wired"** — non sono feature attive nell'inventario.
- **JjScript**: 0 test su 60 file, 19 comandi documentati. L'inventario mostra 20 (`undo`/`redo` separati in `undoredo.ts`).
- **Editor V3**: rimosso 2026-04-06; verificare che nessuna feature dell'inventario faccia riferimento a esso.
- **3 TODO `// TODO: sidebar`**: bookmark per "future sidebar approach" non presenti in inventario (non sono feature, sono note).

### Candidati a feature flag

Esistono già toggle Basic/Advanced o flag espliciti che dovrebbero essere onorati dal sistema di progressive disclosure:

- **`SetRootFieldAction.new('advanced', boolean)`** (Navbar): toggle globale Basic/Advanced — è già il **target principale** della progressive disclosure.
- **`SetRootFieldAction.new('debug', boolean)`** (Navbar): toggle debug mode — visibile solo in Advanced mode.
- **`isExpertMode`** in viewpoint editors (predicate/style/template): controlla read-only su default views.
- **`DevModeContext`** (`src/contexts/DevModeContext.tsx`): toggle dev/debug per features sidebar.
- **`useInterfaceMode()` hook**: pattern per check modalità interfaccia in più componenti.
- **`AIProviderPreferences.ts`**: per-feature provider override — pattern già implementato per AI.

Raccomandazione: il futuro lavoro di disclosure dovrebbe **estendere il flag `advanced`** già presente per nascondere/mostrare le feature 🔴, anziché introdurre un secondo sistema parallelo.

### Codice morto sospetto

> Componenti non importati da App root o non più raggiungibili da menu/route. Esclusi dall'albero feature.

| Nome | Path | Motivo del sospetto |
|------|------|---------------------|
| `MegamodelGraph-toDelete.tsx` | `src/components/megamodel/MegamodelGraph-toDelete.tsx` | Suffisso `-toDelete` esplicito |
| `MegamodelModal-toDelete.tsx` | `src/components/megamodel/MegamodelModal-toDelete.tsx` | Suffisso `-toDelete` esplicito |
| `megamodel-modal-toDelete.scss` | `src/components/megamodel/megamodel-modal-toDelete.scss` | Suffisso `-toDelete` esplicito |
| `templateExample/example.tsx` | `src/templateExample/` | Directory "templateExample" — probabile boilerplate scaffold |
| `templateExample/Name.tsx` | `src/templateExample/` | Idem |
| `templateExample/example.scss` | `src/templateExample/` | Idem |
| `setupProxy.DISABLED.js` | `src/setupProxy.DISABLED.js` | Suffisso `.DISABLED` |
| `index.scss.disabled` | `src/index.scss.disabled` | Suffisso `.disabled` |
| `firefox issues/` | `src/firefox issues/` | Directory con spazio nel nome — appunti, non codice |
| `todo_others` | `src/todo_others` | One-line TODO file ("metrics.tsx → analytics largely placeholders") |
| `src/DSL/` | `src/DSL/` (OCL, Ohm, nearley parsers) | Parser sperimentali precedenti a JjEL/JjTL — verificare nessun import attivo |
| `src/iot/` | `src/iot/` | Sottosistema IoT — nessun componente noto lo importa |
| `src/ocl/` | `src/ocl/` | OCL minimale separato; possibile esperimento legacy |
| `test/TestCredentials.tsx` | `src/test/` | Stub credentials (non `__tests__`) |
| `PermissionModelTab.tsx` | (riferito in `Dock.tsx`) | Importato ma mai istanziato via TabDataMaker |
| `EditorFullscreenOverlay.tsx` | `src/components/editors/viewpoint/` | Componente esistente, integrazione non confermata |
| `EditorSwitch.tsx` | `src/components/abstract/tabs/` | Toggle tra EditorV2 e "alternate views" indefinite — possibile residuo |
| `DV.tsx` (73KB) | `src/common/DV.tsx` | Data viewer monolitico di scopo poco chiaro |
| `Dummy.ts` (43KB) / `Dummy.tsx` (74KB) | `src/common/` | "Dummy" suggerisce stub o scaffolding, dimensioni anomale per uno stub |
| `polymetric/PolymetricView` (3 indizi) | (varie) | Marcato "beta" nel Tools menu — uso reale da confermare |
| `collaborative/CollaborativeAttacher.tsx` | `src/components/collaborative/` | WebSocket attachment — backend `JODEL_COLLABORATIVE` env var, possibile feature dormiente |

---

**Fine inventario.** Per discussioni di classificazione, gap o aggiornamenti, modificare questo file e committare; l'inventario è un documento vivo, non un'API.
