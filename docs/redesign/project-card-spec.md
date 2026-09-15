# JJODEL PROJECT CARD - SPECIFICATION

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation  
**Stile Scelto:** A (Cover Image)

---

## 1. OVERVIEW

### Obiettivo
Ridisegnare le Project Card con uno stile moderno che include:
- Immagine di sfondo dinamica (**colorate e sature**, non sfuocate)
- Informazioni complete e organizzate
- Design minimal e professionale
- **Grid layout** (non colonna singola!)
- **Toggle per vista compatta** (nasconde immagini)

### Layout

```
┌─────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │  [🔒 Private]              [☆] [⋮]             │ │  ← Cover Image (120px)
│ │                                                 │ │
│ │           (background image)                    │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│  Project Name                                       │
│  Description text goes here...                      │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  🔀 3 metamodels    📄 12 models                    │
│                                                     │
│  [A] Alfonso                           8 min ago   │
└─────────────────────────────────────────────────────┘
```

---

## 2. DIMENSIONI

| Proprietà | Valore |
|-----------|--------|
| Card width | `320px` (fisso) o `100%` (responsive in grid) |
| Card min-width | `280px` |
| Card max-width | `360px` |
| Border radius | `12px` |
| Cover image height | `120px` |
| Content padding | `16px` |

---

## 3. COVER IMAGE

### Sorgente Immagini
Usare **Unsplash Source** con query per immagini colorate e vivide:

```
https://source.unsplash.com/400x200/?colorful,abstract
https://source.unsplash.com/400x200/?gradient,vibrant
https://source.unsplash.com/400x200/?nature,colorful
```

Oppure **Picsum Photos** con seed per consistenza:
```
https://picsum.photos/seed/{project-id}/400/200
```

**Nota:** Preferire immagini **colorate e sature**, evitare foto grigie/sfuocate.

### Overlay Gradient
Per garantire leggibilità dei controlli sopra l'immagine:

```scss
.card-cover {
  height: 120px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 12px 12px 0 0;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    border-radius: 12px 12px 0 0;
  }
}
```

### Privacy Badge

```scss
.card-privacy-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  
  display: flex;
  align-items: center;
  gap: 4px;
  
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  
  font-size: 11px;
  font-weight: 500;
  color: #ffffff;
  
  i {
    font-size: 10px;
  }
}
```

### Action Buttons (Favorite + Menu)

```scss
.card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  
  display: flex;
  gap: 6px;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  
  font-size: 16px;
  color: #6B7280;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    background: #ffffff;
    color: #374151;
  }
  
  &.is-favorite {
    color: #F59E0B;
  }
}
```

---

## 4. CONTENT SECTION

### Title

```scss
.card-title {
  margin: 0 0 4px 0;
  font-family: 'Inter Variable', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #111418;
  
  // Truncate if too long
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Description

```scss
.card-description {
  margin: 0 0 12px 0;
  font-family: 'Inter Variable', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #6B7280;
  line-height: 1.4;
  
  // Truncate to 2 lines
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## 5. STATS ROW

```scss
.card-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  
  font-size: 12px;
  color: #9CA3AF;
}

.card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    font-size: 14px;
  }
}
```

**Icone Bootstrap:**
- Metamodels: `bi-diagram-3`
- Models: `bi-file-earmark`

---

## 6. FOOTER (Editor + Time)

```scss
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  
  font-size: 12px;
  color: #9CA3AF;
}

.card-editor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #475569;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
}

.card-time {
  color: #9CA3AF;
}
```

---

## 7. STATI INTERATTIVI

### Hover

```scss
.project-card {
  transition: all 200ms ease;
  
  &:hover {
    border-color: #d0d3d8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}
```

### Focus (Keyboard Navigation)

```scss
.project-card:focus-visible {
  outline: 2px solid #475569;
  outline-offset: 2px;
}
```

### Loading State (Skeleton)

```scss
.project-card.is-loading {
  .card-cover {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 8. COMPLETE SCSS

```scss
// components/project-card/project-card.scss

// ============================================
// VARIABLES
// ============================================
$card-radius: 12px;
$card-border: #e2e4e8;
$card-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
$card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);

$cover-height: 120px;
$content-padding: 16px;

$color-text-primary: #111418;
$color-text-secondary: #6B7280;
$color-text-muted: #9CA3AF;
$color-border-light: #f1f5f9;
$color-favorite: #F59E0B;
$color-avatar: #475569;

$transition: 150ms ease;

// ============================================
// CARD CONTAINER
// ============================================
.project-card {
  background: #ffffff;
  border: 1px solid $card-border;
  border-radius: $card-radius;
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: $card-shadow;
  
  &:hover {
    border-color: darken($card-border, 5%);
    box-shadow: $card-shadow-hover;
    transform: translateY(-2px);
  }
  
  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 2px;
  }
}

// ============================================
// COVER IMAGE
// ============================================
.card-cover {
  height: $cover-height;
  background-size: cover;
  background-position: center;
  position: relative;
  
  // Overlay gradient
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
  }
}

// ============================================
// PRIVACY BADGE
// ============================================
.card-privacy-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  
  display: flex;
  align-items: center;
  gap: 4px;
  
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  
  font-family: 'Inter Variable', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #ffffff;
  
  i {
    font-size: 10px;
  }
}

// ============================================
// ACTION BUTTONS
// ============================================
.card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  
  display: flex;
  gap: 6px;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  
  font-size: 16px;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $transition;
  
  &:hover {
    background: #ffffff;
    color: $color-text-primary;
  }
  
  &.is-favorite {
    color: $color-favorite;
  }
}

// ============================================
// CONTENT
// ============================================
.card-content {
  padding: $content-padding;
}

.card-title {
  margin: 0 0 4px 0;
  font-family: 'Inter Variable', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: $color-text-primary;
  
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  margin: 0 0 12px 0;
  font-family: 'Inter Variable', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: $color-text-secondary;
  line-height: 1.4;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// ============================================
// STATS ROW
// ============================================
.card-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid $color-border-light;
  
  font-family: 'Inter Variable', sans-serif;
  font-size: 12px;
  color: $color-text-muted;
}

.card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    font-size: 14px;
  }
}

// ============================================
// FOOTER
// ============================================
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  
  font-family: 'Inter Variable', sans-serif;
  font-size: 12px;
  color: $color-text-muted;
}

.card-editor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: $color-avatar;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
}

.card-time {
  color: $color-text-muted;
}

// ============================================
// LOADING STATE
// ============================================
.project-card.is-loading {
  pointer-events: none;
  
  .card-cover {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .card-title,
  .card-description,
  .card-stats,
  .card-footer {
    background: #f1f5f9;
    color: transparent;
    border-radius: 4px;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 9. REACT COMPONENT

```tsx
// components/project-card/ProjectCard.tsx

import React from 'react';
import './project-card.scss';

interface Project {
  id: string;
  name: string;
  description?: string;
  editor: string;
  updatedAt: string;
  metamodels: number;
  models: number;
  isPrivate: boolean;
  isFavorite: boolean;
}

interface ProjectCardProps {
  project: Project;
  onFavoriteToggle: (id: string) => void;
  onMenuClick: (id: string, event: React.MouseEvent) => void;
  onClick: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onFavoriteToggle,
  onMenuClick,
  onClick,
}) => {
  const imageUrl = `https://picsum.photos/seed/${project.id}/400/200`;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle(project.id);
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick(project.id, e);
  };
  
  return (
    <article
      className="project-card"
      onClick={() => onClick(project.id)}
      tabIndex={0}
      role="button"
      aria-label={`Open project ${project.name}`}
    >
      {/* Cover Image */}
      <div 
        className="card-cover"
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        {/* Privacy Badge */}
        {project.isPrivate && (
          <span className="card-privacy-badge">
            <i className="bi bi-lock-fill" />
            Private
          </span>
        )}
        
        {/* Actions */}
        <div className="card-actions">
          <button
            className={`card-action-btn ${project.isFavorite ? 'is-favorite' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <i className={project.isFavorite ? 'bi bi-star-fill' : 'bi bi-star'} />
          </button>
          <button
            className="card-action-btn"
            onClick={handleMenuClick}
            aria-label="More options"
          >
            <i className="bi bi-three-dots" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="card-content">
        <h3 className="card-title">{project.name}</h3>
        {project.description && (
          <p className="card-description">{project.description}</p>
        )}
        
        {/* Stats */}
        <div className="card-stats">
          <span className="card-stat">
            <i className="bi bi-diagram-3" />
            {project.metamodels} metamodels
          </span>
          <span className="card-stat">
            <i className="bi bi-file-earmark" />
            {project.models} models
          </span>
        </div>
        
        {/* Footer */}
        <div className="card-footer">
          <div className="card-editor">
            <span className="card-avatar">
              {project.editor.charAt(0).toUpperCase()}
            </span>
            <span>{project.editor}</span>
          </div>
          <span className="card-time">{project.updatedAt}</span>
        </div>
      </div>
    </article>
  );
};
```

---

## 10. GRID LAYOUT (Dashboard)

### Layout Griglia (NON colonna singola!)

Le card DEVONO essere disposte in griglia responsive, mai in colonna singola:

```scss
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 24px;
}

// Responsive breakpoints
@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
}

@media (min-width: 1200px) {
  .projects-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
```

### Esempi di Layout

| Viewport | Colonne |
|----------|---------|
| < 768px | 1 colonna |
| 768px - 1024px | 2 colonne |
| 1024px - 1400px | 3 colonne |
| > 1400px | 4+ colonne |

---

## 11. VIEW MODES (Toggle Vista)

### Tre modalità di visualizzazione

Aggiungere toggle nella toolbar (accanto ai bottoni grid/list esistenti):

```
[📊 Grid] [☰ List] [▤ Compact]
```

| Mode | Descrizione | Cover Image |
|------|-------------|-------------|
| **Grid** | Card con cover image (default) | ✅ Visibile (120px) |
| **List** | Card in righe orizzontali | ✅ Thumbnail laterale (100px) |
| **Compact** | Card senza immagine | ❌ Nascosta |

### Compact View (senza immagini)

Per risparmiare spazio, la vista compatta nasconde la cover image:

```scss
.project-card.compact {
  .card-cover {
    display: none;
  }
  
  .card-content {
    padding: 14px 16px;
  }
  
  .card-title {
    font-size: 15px;
  }
}
```

### Layout Compact

```
┌─────────────────────────────────────────────────────┐
│  📁  Project 6                         ☆  ⋮        │
│      A new Project                                  │
│  ─────────────────────────────────────────────────  │
│  🔀 0 metamodels  📄 0 models    [P] Project  7m   │
└─────────────────────────────────────────────────────┘
```

### Toggle Component

```tsx
interface ViewMode = 'grid' | 'list' | 'compact';

<div className="view-toggle">
  <button 
    className={viewMode === 'grid' ? 'active' : ''}
    onClick={() => setViewMode('grid')}
    aria-label="Grid view"
  >
    <i className="bi bi-grid-3x3-gap" />
  </button>
  <button 
    className={viewMode === 'list' ? 'active' : ''}
    onClick={() => setViewMode('list')}
    aria-label="List view"
  >
    <i className="bi bi-list" />
  </button>
  <button 
    className={viewMode === 'compact' ? 'active' : ''}
    onClick={() => setViewMode('compact')}
    aria-label="Compact view"
  >
    <i className="bi bi-view-stacked" />
  </button>
</div>
```

### Stile Toggle Buttons

```scss
.view-toggle {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 6px;
  gap: 2px;
}

.view-toggle button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #6B7280;
  cursor: pointer;
  transition: all 150ms ease;
  
  &:hover {
    color: #374151;
  }
  
  &.active {
    background: #ffffff;
    color: #111418;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  }
}
```

---

## 12. ICONE BOOTSTRAP USATE

| Elemento | Icona |
|----------|-------|
| Favorite (empty) | `bi-star` |
| Favorite (filled) | `bi-star-fill` |
| Menu | `bi-three-dots` |
| Private | `bi-lock-fill` |
| Metamodels | `bi-diagram-3` |
| Models | `bi-file-earmark` |
| View Grid | `bi-grid-3x3-gap` |
| View List | `bi-list` |
| View Compact | `bi-view-stacked` |

---

## 13. IMPLEMENTATION CHECKLIST

### Phase 1: Card Component
- [ ] Creare `ProjectCard.tsx` component
- [ ] Creare `project-card.scss` con tutti gli stili
- [ ] Usare immagini colorate da Unsplash

### Phase 2: Grid Layout
- [ ] Implementare grid responsive (NON colonna singola)
- [ ] Testare su diverse viewport

### Phase 3: View Modes
- [ ] Aggiungere toggle Grid/List/Compact
- [ ] Implementare vista Compact senza cover image
- [ ] Salvare preferenza utente (localStorage)

### Phase 4: Polish
- [ ] Testare hover/focus states
- [ ] Testare loading skeleton
- [ ] Verificare responsive grid

---

**END OF SPECIFICATION**
