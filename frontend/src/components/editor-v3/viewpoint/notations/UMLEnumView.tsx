/**
 * Editor V3 — UML Enumeration Notation.
 *
 * UML enum box: «enumeration» stereotype, name, literals.
 */

import React, { useCallback } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';
import type { EnumSnapshot } from '../../types';

function UMLEnumView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as EnumSnapshot;

    const handleDoubleClick = useCallback((field: string) => {
        onStartEditing?.(field);
    }, [onStartEditing]);

    return (
        <div className={`v3-uml-enum v3-cs--${colorScheme}`}>
            {/* Header */}
            <div
                className="v3-uml-enum__header"
                onDoubleClick={() => handleDoubleClick('name')}
            >
                <div className="v3-uml-enum__stereotype">{'\u00AB'}enumeration{'\u00BB'}</div>
                <div className="v3-uml-enum__name">
                    {label || 'Enum'}
                </div>
            </div>

            {/* Literals compartment */}
            <div className="v3-uml-enum__compartment">
                {snap.literals.length === 0 ? (
                    <div className="v3-uml-enum__empty">&nbsp;</div>
                ) : (
                    snap.literals.map(lit => (
                        <div
                            key={lit.id}
                            className="v3-uml-enum__literal"
                            onDoubleClick={() => handleDoubleClick(`lit:${lit.id}`)}
                        >
                            {lit.name}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

registerBuiltInView('uml', 'enum', UMLEnumView);

export default UMLEnumView;
