/**
 * Editor V3 — UML Class Notation.
 *
 * Full UML class box: stereotype, name, attributes, operations, references.
 * Supports inline editing via double-click.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';
import type { ClassSnapshot, AttributeInfo, OperationInfo, ReferenceInfo } from '../../types';
import { formatCardinality } from '../../types';

function UMLClassView({ modelSnapshot, modelElementId, label, colorScheme, theme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as ClassSnapshot;
    const [editingField, setEditingField] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingField && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingField]);

    const handleDoubleClick = useCallback((field: string) => {
        onStartEditing?.(field);
    }, [onStartEditing]);

    return (
        <div className={`v3-uml-class v3-cs--${colorScheme}`}>
            {/* Header: stereotype + name */}
            <div
                className="v3-uml-class__header"
                onDoubleClick={() => handleDoubleClick('name')}
            >
                {snap.isInterface && (
                    <div className="v3-uml-class__stereotype">{'\u00AB'}interface{'\u00BB'}</div>
                )}
                {snap.isAbstract && !snap.isInterface && (
                    <div className="v3-uml-class__stereotype">{'\u00AB'}abstract{'\u00BB'}</div>
                )}
                <div className={`v3-uml-class__name ${snap.isAbstract ? 'v3-uml-class__name--abstract' : ''}`}>
                    {label || 'Class'}
                </div>
                {snap.superclassNames.length > 0 && (
                    <div className="v3-uml-class__extends">
                        extends {snap.superclassNames.join(', ')}
                    </div>
                )}
            </div>

            {/* Attributes compartment */}
            <div className="v3-uml-class__compartment">
                {snap.attributes.length === 0 ? (
                    <div className="v3-uml-class__empty">&nbsp;</div>
                ) : (
                    snap.attributes.map(attr => (
                        <div
                            key={attr.id}
                            className="v3-uml-class__attr"
                            onDoubleClick={() => handleDoubleClick(`attr:${attr.id}`)}
                        >
                            <span className="v3-uml-class__visibility">-</span>
                            <span className="v3-uml-class__attr-name">{attr.name}</span>
                            <span className="v3-uml-class__attr-sep">: </span>
                            <span className="v3-uml-class__attr-type">{attr.type}</span>
                            {(attr.lowerBound !== 0 || attr.upperBound !== 1) && (
                                <span className="v3-uml-class__attr-mult">
                                    [{formatCardinality(attr.lowerBound, attr.upperBound)}]
                                </span>
                            )}
                            {attr.defaultValue && (
                                <span className="v3-uml-class__attr-default"> = {attr.defaultValue}</span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Operations compartment */}
            {(snap.operations.length > 0) && (
                <div className="v3-uml-class__compartment">
                    {snap.operations.map(op => (
                        <div
                            key={op.id}
                            className="v3-uml-class__op"
                            onDoubleClick={() => handleDoubleClick(`op:${op.id}`)}
                        >
                            <span className="v3-uml-class__visibility">+</span>
                            <span className="v3-uml-class__op-name">{op.name}</span>
                            <span className="v3-uml-class__op-params">
                                ({op.parameters.map(p => `${p.name}: ${p.type}`).join(', ')})
                            </span>
                            {op.returnType !== 'void' && (
                                <span className="v3-uml-class__op-return">: {op.returnType}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* References compartment (shown below operations if present) */}
            {(snap.references.length > 0) && (
                <div className="v3-uml-class__compartment v3-uml-class__compartment--refs">
                    {snap.references.map(ref => (
                        <div
                            key={ref.id}
                            className="v3-uml-class__ref"
                            onDoubleClick={() => handleDoubleClick(`ref:${ref.id}`)}
                        >
                            <span className="v3-uml-class__visibility">
                                {ref.containment ? '\u25C6' : '\u2192'}
                            </span>
                            <span className="v3-uml-class__ref-name">{ref.name}</span>
                            <span className="v3-uml-class__attr-sep">: </span>
                            <span className="v3-uml-class__ref-target">{ref.targetClassName}</span>
                            <span className="v3-uml-class__attr-mult">
                                [{formatCardinality(ref.lowerBound, ref.upperBound)}]
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Register for both 'uml' notation
registerBuiltInView('uml', 'class', UMLClassView);

export default UMLClassView;
