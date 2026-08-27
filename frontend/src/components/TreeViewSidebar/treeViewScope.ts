/**
 * treeViewScope — quali classifier il viewpoint attivo rende, e su quale
 * metamodello la domanda ha senso.
 *
 * Il filtro e' ancorato all'ARTEFATTO APERTO, non all'albero: lo scopo e' il
 * metamodello dell'artefatto su cui l'utente sta lavorando, e le tre categorie
 * che ne discendono sono
 *
 *   1. reso dal viewpoint attivo            -> riga normale;
 *   2. non reso, dentro lo scopo            -> riga dimmed, feature collassate;
 *   3. fuori scopo (altro metamodello)      -> nessun dimming, solo collassato.
 *
 * La terza categoria non e' un dettaglio: il viewpoint non ha opinioni su un
 * metamodello che non e' quello dell'artefatto aperto, e dimmarlo sarebbe una
 * bugia. Per questo `scopeMetamodelIds` e' un insieme e non un flag.
 *
 * DEGRADAZIONE. Ogni ramo in cui l'informazione manca ritorna null, e chi legge
 * torna al comportamento precedente (nessun dimming, scope bar assente). Non si
 * mostra mai uno scopo approssimato pur di mostrare qualcosa:
 * - nessun viewpoint attivo (root `state.viewpoint` vuoto);
 * - viewpoint classico (jsxString): non c'e' indice IR da interrogare;
 * - viewpoint con view wildcard: rende tutto, non esclude nulla;
 * - artefatto aperto non determinabile.
 *
 * ARTEFATTO APERTO, v1. Lo ricaviamo da `_lastSelected.modelElement`, l'unico
 * canale Redux disponibile: e' la SELEZIONE, non la tab. Coincide con la tab
 * attiva nell'uso normale e degrada a null quando non c'e' selezione. La tab vera
 * vive nel dock (`JjodelEvents.ACTIVE_TAB`, cfr. StatusBar) e una trasformazione
 * aperta porterebbe lo scopo a due metamodelli via sourceMetamodelId /
 * targetMetamodelId: entrambi sono il giro successivo, come modifica isolata.
 * `TreeViewScopeBar` accetta gia' un array di scopo per quel caso.
 */

import { useSelector } from 'react-redux';
import type { DState } from '../../joiner';
import { computeIRSignature, getIRIndex } from '../editor-v2/viewpoint/ir/irResolve';
import { renderedMetaclassNames } from '../editor-v2/viewpoint/ir/irInteraction';

export interface TreeViewScope {
    /** Nome del viewpoint attivo, per la scope bar. */
    viewpointName: string;
    /** Metamodelli su cui il filtro agisce. Uno oggi; due con una trasformazione aperta. */
    scopeMetamodelIds: string[];
    scopeMetamodelNames: string[];
    /**
     * Nomi dei classifier resi dal viewpoint attivo. Chiavato per NOME, come
     * `ir.metaclasses`: due metamodelli che dichiarano entrambi `State` collidono.
     * Lo scopo a un solo metamodello riduce la collisione al caso di omonimi
     * dentro lo stesso metamodello; la via d'uscita, quando servira', e'
     * `resolveMetaclassId` in editor-v2/viewpoint/ir/metaclassPin.ts, che risolve
     * un nome sulla classe concreta attraverso la pin map della view.
     */
    rendered: ReadonlySet<string>;
    /** Quanti classifier, nello scopo, il viewpoint non rende. */
    excludedCount: number;
}

/** Risale da un elemento selezionato al DModel che lo contiene. */
function resolveOpenModelId(state: DState): string | null {
    const selectedPtr = (state as any)._lastSelected?.modelElement;
    if (!selectedPtr) return null;
    const lookup = (state as any).idlookup;
    let current = lookup?.[selectedPtr];
    let depth = 0;
    while (current && depth < 10) {
        if (current.className === 'DModel') return current.id;
        const fatherId = current.father || current.model;
        if (!fatherId || typeof fatherId !== 'string') break;
        current = lookup?.[fatherId];
        depth++;
    }
    return null;
}

/** Nomi dei classifier di un metamodello, dal D-layer (packages -> classes, ricorsivo). */
function collectClassNames(lookup: any, packageIds: unknown, out: string[], depth = 0): void {
    if (!Array.isArray(packageIds) || depth > 20) return;
    for (const pid of packageIds) {
        const pkg = lookup?.[pid];
        if (!pkg) continue;
        if (Array.isArray(pkg.classes)) {
            for (const cid of pkg.classes) {
                const cls = lookup?.[cid];
                if (cls && typeof cls.name === 'string') out.push(cls.name);
            }
        }
        collectClassNames(lookup, pkg.subpackages, out, depth + 1);
    }
}

/**
 * Lo scopo corrente, o null quando l'informazione di resa non esiste.
 *
 * Costo: `computeIRSignature` scorre la lista di puntatori delle viewelement,
 * `getIRIndex` e' cachata per signature, `renderedMetaclassNames` e' cachata
 * sull'indice. Resta una passata sui nomi delle classi del metamodello in scopo,
 * strettamente piu' economica dell'albero che mapStateToProps ricostruisce
 * comunque a ogni chiamata.
 */
export function computeTreeViewScope(state: DState): TreeViewScope | null {
    const viewpointId = (state as any).viewpoint;
    if (!viewpointId) return null;

    const index = getIRIndex(state, computeIRSignature(state));
    const rendered = renderedMetaclassNames(index);
    if (!rendered) return null;

    const lookup = (state as any).idlookup;
    const openModel = resolveOpenModelId(state);
    if (!openModel) return null;

    const openModelData = lookup?.[openModel];
    if (!openModelData) return null;
    // Un metamodello e' scopo di se stesso; un modello M1 porta in scopo il proprio.
    const scopeId: string | undefined = openModelData.isMetamodel === false
        ? openModelData.instanceof
        : openModelData.id;
    const scopeData = scopeId ? lookup?.[scopeId] : undefined;
    if (!scopeData || scopeData.className !== 'DModel') return null;

    const classNames: string[] = [];
    collectClassNames(lookup, scopeData.packages, classNames);
    let excludedCount = 0;
    for (const name of classNames) if (!rendered.has(name)) excludedCount++;

    return {
        viewpointName: lookup?.[viewpointId]?.name || 'Viewpoint',
        scopeMetamodelIds: [scopeData.id],
        scopeMetamodelNames: [scopeData.name || 'Unnamed Metamodel'],
        rendered,
        excludedCount,
    };
}

function scopeEqual(a: TreeViewScope | null, b: TreeViewScope | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.viewpointName === b.viewpointName
        && a.excludedCount === b.excludedCount
        && a.rendered === b.rendered
        && a.scopeMetamodelIds.length === b.scopeMetamodelIds.length
        && a.scopeMetamodelIds.every((id, i) => id === b.scopeMetamodelIds[i])
        && a.scopeMetamodelNames.every((n, i) => n === b.scopeMetamodelNames[i]);
}

/**
 * Hook per le superfici montate accanto all'albero (la scope bar). Il comparatore
 * evita il re-render a ogni azione Redux: `rendered` e' stabile per identita'
 * (cachata sull'indice IR), il resto sono scalari.
 */
export function useTreeViewScope(): TreeViewScope | null {
    return useSelector((state: DState) => computeTreeViewScope(state), scopeEqual);
}
