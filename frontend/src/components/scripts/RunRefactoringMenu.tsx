/**
 * The «Run refactoring…» menu of a metamodel or model tab in the app bar (R-JJD-14).
 *
 * The item lists the project's Refactorings that fit the artifact (`projectRefactoringsFor`) and runs
 * the chosen one on the whole artifact through the ghost preview, by the same `runScriptOnModel` as the
 * Refactoring tab's `Run on`: the artifact's tab is raised first, nothing runs before the preview, and
 * Apply stays on the canvas bar. With no Refactoring the item is disabled. The menu itself is the
 * megamodel's `MegamodelContextMenu`; this component only fills it, in two steps.
 */
import React, { useCallback, useRef, useState } from 'react';
import MegamodelContextMenu, { type MenuItem } from '../megamodel/MegamodelContextMenu';
import { projectRefactoringsFor, runScriptOnModel } from './scriptFiles';
import { refactoringChoice } from './projectScripts';

export interface RunRefactoringMenuProps {
    modelId: string;
    x: number;
    y: number;
    onClose: () => void;
}

export const NO_REFACTORING_TOOLTIP = 'No refactoring for this artifact';

const RunRefactoringMenu: React.FC<RunRefactoringMenuProps> = ({ modelId, x, y, onClose }) => {
    const [stage, setStage] = useState<'root' | 'list'>('root');
    // The menu calls the item's action, then onClose: the root item opens the list instead of closing.
    const toList = useRef(false);
    const closeRoot = useCallback(() => {
        if (toList.current) { toList.current = false; return; }
        onClose();
    }, [onClose]);

    const refactorings = projectRefactoringsFor(modelId);
    const items: MenuItem[] = stage === 'root'
        ? [{
            label: 'Run refactoring…', icon: 'bi-arrow-repeat',
            disabled: !refactorings.length,
            title: refactorings.length ? undefined : NO_REFACTORING_TOOLTIP,
            action: () => { toList.current = true; setStage('list'); },
        }]
        : refactorings.map(r => ({
            ...refactoringChoice(r), icon: 'bi-arrow-repeat',
            action: () => { void runScriptOnModel(r.text, modelId); },
        }));

    return <MegamodelContextMenu key={stage} x={x} y={y} items={items} onClose={stage === 'root' ? closeRoot : onClose} />;
};

export default RunRefactoringMenu;
