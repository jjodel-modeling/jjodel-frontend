/**
 * Editor V3 — UML Package Notation.
 *
 * UML package box: tabbed header with name, child count badge.
 */

import React, { useCallback } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';
import type { PackageSnapshot } from '../../types';

function UMLPackageView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as PackageSnapshot;

    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-uml-package v3-cs--${colorScheme}`}>
            {/* Tab */}
            <div className="v3-uml-package__tab">
                <div
                    className="v3-uml-package__name"
                    onDoubleClick={handleDoubleClick}
                >
                    {label || 'Package'}
                </div>
            </div>

            {/* Body */}
            <div className="v3-uml-package__body">
                {snap.childCount > 0 && (
                    <div className="v3-uml-package__badge">
                        {snap.childCount} element{snap.childCount !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}

registerBuiltInView('uml', 'package', UMLPackageView);

export default UMLPackageView;
