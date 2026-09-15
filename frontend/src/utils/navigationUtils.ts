// ============================================
// UTILITY FUNCTION - isProjectOverviewPage
// ============================================
// File: frontend/src/utils/navigationUtils.ts (o altro percorso appropriato)

import DockManager from '../components/abstract/DockManager';

/**
 * Verifica se l'utente si trova nella pagina di overview del progetto
 * (quella che mostra METAMODELS, MODELS, VIEWPOINTS)
 * 
 * @returns true se sei nella pagina overview, false se sei nell'editor di un metamodello/modello
 */
export function isProjectOverviewPage(): boolean {
    const dock = DockManager.dock;
    
    if (!dock) {
        // Se il dock non è ancora inizializzato, assumiamo che siamo in overview
        return true;
    }
    
    try {
        const layout = dock.getLayout();
        
        // Il pannello 'models' è il primo child del dockbox
        const modelsPanel = layout?.dockbox?.children?.[0];
        
        if (modelsPanel && 'tabs' in modelsPanel) {
            // Se c'è solo 1 tab (ModelsSummary), siamo nella pagina overview
            // Se ci sono 2+ tabs, c'è un metamodello/modello aperto
            return modelsPanel.tabs.length <= 1;
        }
        
        // Se non riusciamo a determinare, assumiamo overview
        return true;
    } catch (error) {
        console.error('Error checking if in overview page:', error);
        return true;
    }
}

/**
 * Verifica se c'è un editor aperto (metamodello o modello)
 * 
 * @returns true se c'è un editor aperto, false se sei solo nella pagina overview
 */
export function isEditorOpen(): boolean {
    return !isProjectOverviewPage();
}

/**
 * Ottiene il numero di tab aperti nel pannello models
 * 
 * @returns numero di tab aperti (incluso ModelsSummary)
 */
export function getOpenTabsCount(): number {
    const dock = DockManager.dock;
    
    if (!dock) return 0;
    
    try {
        const layout = dock.getLayout();
        const modelsPanel = layout?.dockbox?.children?.[0];
        
        if (modelsPanel && 'tabs' in modelsPanel) {
            return modelsPanel.tabs.length;
        }
        
        return 0;
    } catch (error) {
        console.error('Error getting tabs count:', error);
        return 0;
    }
}
