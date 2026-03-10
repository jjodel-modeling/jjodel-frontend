/**
 * Editor V3 — Simplified Class Notation.
 *
 * Minimal card: name + attribute count + reference count.
 * No compartments, no visibility markers, no types.
 * Used as alternative notation to demonstrate live switching.
 */

import React, { useCallback } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';
import type { ClassSnapshot, EnumSnapshot, PackageSnapshot, DataTypeSnapshot } from '../../types';

function SimplifiedClassView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as ClassSnapshot;

    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-simplified v3-cs--${colorScheme}`}>
            <div className="v3-simplified__name" onDoubleClick={handleDoubleClick}>
                {label || 'Class'}
            </div>
            <div className="v3-simplified__badges">
                {snap.attributes.length > 0 && (
                    <span className="v3-simplified__badge v3-simplified__badge--attr">
                        {snap.attributes.length} attr
                    </span>
                )}
                {snap.references.length > 0 && (
                    <span className="v3-simplified__badge v3-simplified__badge--ref">
                        {snap.references.length} ref
                    </span>
                )}
                {snap.operations.length > 0 && (
                    <span className="v3-simplified__badge v3-simplified__badge--op">
                        {snap.operations.length} op
                    </span>
                )}
            </div>
        </div>
    );
}

function SimplifiedEnumView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as EnumSnapshot;

    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-simplified v3-simplified--enum v3-cs--${colorScheme}`}>
            <div className="v3-simplified__name" onDoubleClick={handleDoubleClick}>
                {label || 'Enum'}
            </div>
            <div className="v3-simplified__badges">
                <span className="v3-simplified__badge v3-simplified__badge--lit">
                    {snap.literals.length} literal{snap.literals.length !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}

function SimplifiedPackageView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as PackageSnapshot;

    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-simplified v3-simplified--package v3-cs--${colorScheme}`}>
            <div className="v3-simplified__name" onDoubleClick={handleDoubleClick}>
                {label || 'Package'}
            </div>
            {snap.childCount > 0 && (
                <div className="v3-simplified__badges">
                    <span className="v3-simplified__badge">
                        {snap.childCount} child{snap.childCount !== 1 ? 'ren' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

function SimplifiedDataTypeView({ modelSnapshot, label, colorScheme, onStartEditing }: BuiltInViewProps) {
    const snap = modelSnapshot as DataTypeSnapshot;

    const handleDoubleClick = useCallback(() => {
        onStartEditing?.('name');
    }, [onStartEditing]);

    return (
        <div className={`v3-simplified v3-simplified--datatype v3-cs--${colorScheme}`}>
            <div className="v3-simplified__name" onDoubleClick={handleDoubleClick}>
                {label || snap.typeName}
            </div>
        </div>
    );
}

// Register all simplified views
registerBuiltInView('simplified', 'class', SimplifiedClassView);
registerBuiltInView('simplified', 'enum', SimplifiedEnumView);
registerBuiltInView('simplified', 'package', SimplifiedPackageView);
registerBuiltInView('simplified', 'datatype', SimplifiedDataTypeView);

export { SimplifiedClassView, SimplifiedEnumView, SimplifiedPackageView, SimplifiedDataTypeView };
