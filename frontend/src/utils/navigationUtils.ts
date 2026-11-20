// ============================================
// UTILITY FUNCTION - isProjectOverviewPage
// ============================================
// File: frontend/src/utils/navigationUtils.ts (o altro percorso appropriato)

import DockManager from '../components/abstract/DockManager';
import { modelGroups } from '../components/abstract/tabs/dockGroups';

/** The tabs of every editor group (R-MT-30): with one group, the tabs of its only panel. */
function openTabsOf(groups: ReturnType<typeof modelGroups>): number {
    return groups.reduce((n, group) => n + group.tabs.length, 0);
}

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
        
        // I pannelli 'models' sono i gruppi di editor (R-MT-30): con un gruppo solo, il primo child del dockbox
        const groups = modelGroups(layout);
        
        if (groups.length > 0) {
            // Se c'è solo 1 tab (ModelsSummary), siamo nella pagina overview
            // Se ci sono 2+ tabs, c'è un metamodello/modello aperto
            return openTabsOf(groups) <= 1;
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
        const groups = modelGroups(layout);
        
        if (groups.length > 0) {
            return openTabsOf(groups);
        }
        
        return 0;
    } catch (error) {
        console.error('Error getting tabs count:', error);
        return 0;
    }
}
