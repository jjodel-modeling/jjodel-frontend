import React from 'react';
import { useTreeViewScope } from './treeViewScope';

/**
 * TreeViewScopeBar — dichiara lo scopo del filtro per viewpoint.
 *
 * Il filtro è ancorato all'ARTEFATTO APERTO, non all'albero: questa riga dice su
 * quale viewpoint e su quali metamodelli sta agendo, e quanti elementi esclude.
 * Aprire una trasformazione porta lo scopo a due metamodelli (source e target),
 * per questo `scope` è un array.
 *
 * `TreeViewScopeBar` è presentazionale: nessuna dipendenza da Redux, e senza un
 * viewpoint attivo non renderizza nulla. Il wiring vive in `TreeViewScopeBarLive`
 * in fondo al file, che è ciò che i punti di montaggio usano.
 */

interface TreeViewScopeBarProps {
    /** Nome del viewpoint attivo. Vuoto/undefined ⇒ il componente non renderizza. */
    viewpointName?: string;
    /** Metamodelli su cui il filtro agisce. Uno per un modello aperto, due per una trasformazione. */
    scope: string[];
    /** Quanti elementi il viewpoint non rende, nello scopo corrente. */
    excludedCount: number;
    /** Toggle "mostra tutto". Persistere per progetto, non per sessione. */
    onShowExcluded?: () => void;
    showingAll?: boolean;
}

export const TreeViewScopeBar: React.FC<TreeViewScopeBarProps> = ({
    viewpointName,
    scope,
    excludedCount,
    onShowExcluded,
    showingAll = false,
}) => {
    if (!viewpointName) return null;

    const scopeLabel = scope.filter(Boolean).join(', ');

    return (
        <div className="tree-scope-bar" role="status">
            <i className="bi bi-funnel tree-scope-bar__icon" aria-hidden />
            <span className="tree-scope-bar__label" title={`${viewpointName} on ${scopeLabel}`}>
                filter: <strong>{viewpointName}</strong>
                {scopeLabel && <> on <strong>{scopeLabel}</strong></>}
            </span>
            {/* Senza `onShowExcluded` il conteggio e' testo, non un bottone: il toggle
                "mostra tutto" non esiste ancora e un controllo inerte prometterebbe
                un'azione che non c'e'. Il dimming non nasconde nulla, quindi la via
                di fuga non serve — quando servira', il bottone torna qui. */}
            {excludedCount > 0 && (
                onShowExcluded ? (
                    <button
                        type="button"
                        className="tree-scope-bar__action"
                        onClick={onShowExcluded}
                        aria-pressed={showingAll}
                    >
                        {showingAll ? 'hide excluded' : `${excludedCount} excluded`}
                    </button>
                ) : (
                    <span className="tree-scope-bar__count">
                        {excludedCount} excluded
                    </span>
                )
            )}
        </div>
    );
};

export default TreeViewScopeBar;

/**
 * La scope bar cablata sullo stato. Renderizza SOLO quando l'informazione di resa
 * esiste davvero — indice IR presente, nessuna view wildcard, artefatto aperto
 * determinabile (cfr. `computeTreeViewScope`). In ogni altro caso sparisce invece
 * di annunciare un filtro che non sta applicando.
 *
 * Va montata dentro `.tree-view-panel-container` e FUORI da `.tree-view-panel-body`,
 * così non scorre via con l'albero.
 */
export const TreeViewScopeBarLive: React.FC = () => {
    const scope = useTreeViewScope();
    if (!scope) return null;
    return (
        <TreeViewScopeBar
            viewpointName={scope.viewpointName}
            scope={scope.scopeMetamodelNames}
            excludedCount={scope.excludedCount}
        />
    );
};
