# Handover: Breadcrumb Type Badge e Rimozione Header Ridondante
**Data**: 25 Gennaio 2026
**Componente**: ViewData (Editor View/Viewpoint)

## Task Completato
1. Aggiunto badge tipo (VIEW/VIEWPOINT) al breadcrumb di navigazione
2. Rimosso header ridondante "View: {name}" da tutti i tab content

## Problemi Risolti
1. ✅ Breadcrumb senza indicazione del tipo → ora mostra badge VIEW o VIEWPOINT
2. ✅ Header "View: Class" ridondante → rimosso (info già nel breadcrumb)
3. ✅ Spazio verticale sprecato dai tab content → layout più compatto

## File Modificati

### Breadcrumb con Badge
- `frontend/src/components/editors/views/ViewData.tsx` (linee 76-90)
  - Aggiunto `<span className="breadcrumb-type-badge">` dopo l'ultimo path element
  - Badge mostra "VIEW" o "VIEWPOINT" basato su `isVP`

### Rimozione Header Ridondanti
- `frontend/src/components/editors/views/data/TemplateData.tsx` - Rimosso `<h1 className={'view'}>View: {props.view.name}</h1>`
- `frontend/src/components/editors/views/data/PaletteData.tsx` - Rimosso `<h1 className={'view'}>View: {props.view.name}</h1>`
- `frontend/src/components/editors/views/data/GenericNodeData.tsx` - Rimosso `<h1 className={'view'}>View: {view.name}</h1>`
- `frontend/src/components/editors/views/data/CustomData.tsx` - Rimosso `<h1 className={'view'}>View: {view.name}</h1>`
- `frontend/src/components/editors/views/data/InfoData.tsx` - Rimosso `<h1 className={'apply-to-header'}>View: {view.name}</h1>`

### Stili Badge
- `frontend/src/components/editors/views/nestedView.scss` (linee 1896-1920)
  - Aggiunto stile `.breadcrumb-type-badge` dentro `.path-list`

## Design Decisions

### Badge Styling
```scss
.breadcrumb-type-badge {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: $radius-sm;

  &.view {
    background-color: rgba(71, 85, 105, 0.1);  // Slate
    color: #475569;
  }

  &.viewpoint {
    background-color: rgba(139, 92, 246, 0.1);  // Violet
    color: #8b5cf6;
  }
}
```

### Logica Badge
- **VIEW**: Quando `view.className !== DViewPoint.cname`
- **VIEWPOINT**: Quando `view.className === DViewPoint.cname`

## Risultato Visivo

**PRIMA:**
```
← Default > Model > Package > Class

[Apply to] [Template] [Style] [Events] [Options] [Permissions]

View: Class          ← RIDONDANTE
Default Events
```

**DOPO:**
```
← Default > Model > Package > Class  [VIEW]

[Apply to] [Template] [Style] [Events] [Options] [Permissions]

Default Events       ← Contenuto inizia subito
```

## Pattern Stabiliti
- Badge tipo: `10px` font, uppercase, colore basato sul tipo
- VIEW badge: Slate/gray (#475569)
- VIEWPOINT badge: Violet (#8b5cf6)
- Badge posizionato inline dopo l'ultimo elemento breadcrumb

## Correlazione con Task Precedenti
- Redesign Viewpoints (2026-01-24-viewpoints-redesign.md)
- Monaco Editors Fullscreen Integration (2026-01-25-monaco-editors-fullscreen.md)

## Prossimi Step Suggeriti
1. [ ] Aggiungere badge per altri tipi se necessario (CLASS, PACKAGE, etc.)
2. [ ] Considerare tooltip sul badge per info aggiuntive
3. [ ] Verificare visualizzazione su schermi piccoli
4. [ ] Continuare redesign ViewData.tsx (form layout, styling)
