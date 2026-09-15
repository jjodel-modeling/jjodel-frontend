# Handover: Monaco Editor Fullscreen Integration
**Data**: 25 Gennaio 2026
**Componente**: Tutti gli editor Monaco

## Overview
Integrazione completa di EditorToolbar e EditorFullscreenModal in tutti gli editor Monaco del progetto, unificando l'esperienza utente per l'editing del codice.

## Task Completati

### 1. Creazione Componenti Condivisi
- **EditorToolbar** - Toolbar unificata per tutti gli editor con:
  - Toggle collapse/expand
  - Toggle word wrap
  - Copy to clipboard
  - Fullscreen button
- **EditorFullscreenModal** - Modal fullscreen per editing confortevole

### 2. Integrazione in 6 Editor

#### JavaScript Editors
| File | Componente | Lingua Monaco |
|------|------------|---------------|
| `languages/Js.tsx` | JsEditor | typescript |
| `languages/Javascript.tsx` | JavascriptEditor | typescript |
| `languages/Ocl.tsx` | OclEditor | javascript |

#### Specialized Editors
| File | Componente | Lingua Monaco |
|------|------------|---------------|
| `views/data/PaletteData.tsx` | CSS/LESS Editor | less |
| `MTM.tsx` | Model-to-Text Editor | dynamic |
| `forEndUser/FunctionComponent.tsx` | Function Editor | plaintext |

## File Modificati

### Componenti Nuovi
- `frontend/src/components/editors/EditorToolbar.tsx`
- `frontend/src/components/editors/EditorToolbar.scss`
- `frontend/src/components/editors/EditorFullscreenModal.tsx`
- `frontend/src/components/editors/EditorFullscreenModal.scss`
- `frontend/src/components/editors/monacoConfig.ts` - Configurazioni centralizzate

### Editor Aggiornati
```
frontend/src/components/editors/
├── languages/
│   ├── Js.tsx          ✅ EditorToolbar + EditorFullscreenModal
│   ├── Javascript.tsx  ✅ EditorToolbar + EditorFullscreenModal
│   └── Ocl.tsx         ✅ EditorToolbar + EditorFullscreenModal
├── views/data/
│   └── PaletteData.tsx ✅ EditorToolbar + EditorFullscreenModal
└── MTM.tsx             ✅ EditorToolbar + EditorFullscreenModal

frontend/src/components/forEndUser/
└── FunctionComponent.tsx ✅ EditorToolbar + EditorFullscreenModal
```

## Pattern Implementato

### State Variables (ogni editor)
```typescript
const [wrap, setWrap] = useStateIfMounted(false);
const [fullscreen, setFullscreen] = useStateIfMounted(false);
const [expand, setExpand] = useStateIfMounted(false);
const [showEditor, setShowEditor] = useStateIfMounted(true);
```

### EditorToolbar Props
```typescript
<EditorToolbar
    title="Editor Title"
    icon="bi-icon-name"
    content={editorContent}
    collapsed={!showEditor}
    onCollapseToggle={() => setShowEditor(!showEditor)}
    onWrapChange={(newWrap) => setWrap(newWrap)}
    onExpandChange={(newExpanded) => setExpand(newExpanded)}
    onFullscreenOpen={() => setFullscreen(true)}
    disableFullscreen={false}
    initialExpanded={expand}
    readOnly={readOnly}
/>
```

### EditorFullscreenModal Props
```typescript
<EditorFullscreenModal
    isOpen={fullscreen}
    onClose={() => { blur(); setFullscreen(false); }}
    title="Editor Title"
    icon="bi-icon-name"
    value={content}
    onChange={handleChange}
    onSave={(newValue) => {
        // Save logic
        setFullscreen(false);
    }}
    language="typescript"
    readOnly={readOnly}
/>
```

## Funzionalità Fullscreen Modal

### Features
- **Dimensioni**: 92vw × 88vh (max 1600px larghezza)
- **Keyboard shortcuts**:
  - `ESC` - Chiudi modal
  - `Ctrl/Cmd + S` - Salva e chiudi
- **Toolbar azioni**:
  - Word wrap toggle
  - Copy to clipboard
  - Format document (se non readonly)
  - Close button
- **Footer info**:
  - Posizione cursore (Ln, Col)
  - Conteggio linee e caratteri
  - Indicatore lingua
  - Save button

### Styling
```scss
.editor-fullscreen-modal {
  width: 92vw;
  height: 88vh;
  max-width: 1600px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## Monaco Configurations

### monacoConfig.ts
Configurazioni centralizzate per diversi use case:
- `baseMonacoOptions` - Opzioni base
- `compactMonacoOptions` - Per editor piccoli
- `mediumMonacoOptions` - Per editor medi
- `cssMonacoOptions` - Per CSS/LESS
- `withReadOnly(options, readOnly)` - Helper per readonly

## Correlazione con Altri Task
- Segue il redesign Viewpoints (2026-01-24)
- Precede breadcrumb badge task (2026-01-25)

## Prossimi Step Suggeriti
1. [ ] Aggiungere fullscreen a JsxEditor (se non presente)
2. [ ] Considerare syntax highlighting per altri linguaggi
3. [ ] Test performance con file molto grandi
4. [ ] Dark mode support per modal fullscreen
