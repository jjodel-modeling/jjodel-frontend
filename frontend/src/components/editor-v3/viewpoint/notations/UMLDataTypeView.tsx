/**
 * Editor V3 — UML DataType Notation.
 *
 * UML data type box: «dataType» stereotype + name.
 */

import React, { useCallback } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';

function UMLDataTypeView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-uml-datatype v3-cs--${colorScheme}`}>
            <div
                className="v3-uml-datatype__header"
                onDoubleClick={handleDoubleClick}
            >
                <div className="v3-uml-datatype__stereotype">{'\u00AB'}dataType{'\u00BB'}</div>
                <div className="v3-uml-datatype__name">
                    {label || 'DataType'}
                </div>
            </div>
        </div>
    );
}

registerBuiltInView('uml', 'datatype', UMLDataTypeView);

export default UMLDataTypeView;
