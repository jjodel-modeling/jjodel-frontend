# TODO: Fix tab duplicati quando si apre un metamodel dalla dashboard

## BUG
Quando l'utente clicca sulla card di un metamodel nella project dashboard, viene sempre creato un nuovo tab anche se quel metamodel è già aperto. Risultato: N tab identici "metamodel_1".

## ROOT CAUSE
`DockManager.open()` in `frontend/src/components/abstract/DockManager.ts` (riga ~84) usa `dockMove` che aggiunge sempre un nuovo tab senza verificare se ne esiste già uno con lo stesso ID.

## FILE COINVOLTI
- `frontend/src/components/abstract/DockManager.ts` — metodo `open` (riga ~84) e `open2` (riga ~91)
- `frontend/src/pages/components/Dashboard.tsx` — righe 413, 434 dove viene chiamato `DockManager.open2(mm)` e `DockManager.open2(model)`

## FIX PROPOSTO
In `DockManager.open()`, prima di chiamare `dockMove`, verificare se esiste già un tab con lo stesso ID nel layout. Se sì, attivarlo con `dock.updateTab(tabId, null, true)` invece di aggiungerne uno nuovo.

```typescript
// Pseudocodice del fix
static open(group: string, tab: TabData) {
    const dock = DockManager.dock;
    if (!dock) return;
    
    // Check if tab already exists
    const existingTab = dock.find(tab.id);
    if (existingTab) {
        dock.updateTab(tab.id, null, true);
        return;
    }
    
    // Existing logic: dockMove
    const index = group === 'models' ? 0 : 1;
    dock.dockMove(tab, ...);
}
```

**NOTA**: verificare che `dock.find()` esista nell'API di rc-dock. Se non esiste, cercare nel layout manualmente.

## PRIORITÀ
Bassa — bug pre-esistente, non introdotto dalle modifiche recenti. Funzionalmente non rompe nulla, solo UX.
