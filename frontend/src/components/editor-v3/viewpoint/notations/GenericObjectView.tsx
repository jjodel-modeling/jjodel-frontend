/**
 * Editor V3 — GenericObjectView: default view for M1 object instances.
 *
 * Renders a DObject node with:
 * - Header: underlined "objectName : ClassName" (UML instance notation)
 * - Feature values: attribute values inline-editable, reference values as links
 *
 * Self-registers for both 'uml' and 'simplified' notations.
 */

import React, { useCallback, useState, memo } from 'react';
import { registerBuiltInView, type BuiltInViewProps } from '../registry/ViewRegistry';
import type { ObjectSnapshot, FeatureValueInfo } from '../../types';

function GenericObjectViewInner({
    modelSnapshot,
    modelElementId,
    label,
    colorScheme,
    theme,
    onStartEditing,
}: BuiltInViewProps) {
    const snap = modelSnapshot as ObjectSnapshot;

    const handleDoubleClick = useCallback((field: string) => {
        onStartEditing?.(field);
    }, [onStartEditing]);

    return (
        <div className={`v3-uml-object v3-cs--${colorScheme}`}>
            {/* Header: objectName : ClassName — underlined per UML convention */}
            <div
                className="v3-uml-object__header"
                onDoubleClick={() => handleDoubleClick('name')}
            >
                <div className="v3-uml-object__title">
                    <span className="v3-uml-object__name">{label}</span>
                    <span className="v3-uml-object__classname">
                        : {snap.instanceOfClassName}
                    </span>
                </div>
            </div>

            {/* Feature values */}
            {snap.features.length > 0 && (
                <div className="v3-uml-object__features">
                    {snap.features.map(fv => (
                        <FeatureRow key={fv.id} feature={fv} objectId={modelElementId} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {snap.features.length === 0 && (
                <div className="v3-uml-object__empty">
                    no features
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Feature Row
// ---------------------------------------------------------------------------

function FeatureRow({ feature, objectId }: { feature: FeatureValueInfo; objectId: string }) {
    const isRef = feature.featureKind === 'reference';
    const valueStr = isRef
        ? (feature.resolvedNames?.join(', ') || '—')
        : (feature.values.length > 0 ? String(feature.values[0] ?? '') : '');

    return (
        <div className={`v3-uml-object__feature ${isRef ? 'v3-uml-object__feature--ref' : ''}`}>
            <span className="v3-uml-object__feature-name">{feature.featureName}</span>
            <span className="v3-uml-object__feature-eq">=</span>
            <span className="v3-uml-object__feature-value">{valueStr}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Simplified Object View (compact)
// ---------------------------------------------------------------------------

function SimplifiedObjectView({
    modelSnapshot,
    modelElementId,
    label,
    colorScheme,
    onStartEditing,
}: BuiltInViewProps) {
    const snap = modelSnapshot as ObjectSnapshot;

    const attrCount = snap.features.filter(f => f.featureKind === 'attribute').length;
    const refCount = snap.features.filter(f => f.featureKind === 'reference').length;

    return (
        <div className={`v3-simplified-object v3-cs--${colorScheme}`}>
            <div
                className="v3-simplified-object__header"
                onDoubleClick={() => onStartEditing?.('name')}
            >
                <span className="v3-simplified-object__name">{label}</span>
                <span className="v3-simplified-object__classname">: {snap.instanceOfClassName}</span>
            </div>
            <div className="v3-simplified-object__badges">
                {attrCount > 0 && (
                    <span className="v3-simplified-object__badge">{attrCount} val</span>
                )}
                {refCount > 0 && (
                    <span className="v3-simplified-object__badge v3-simplified-object__badge--ref">{refCount} ref</span>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Register views
// ---------------------------------------------------------------------------

const UMLObjectView = memo(GenericObjectViewInner);
const SimplifiedObjectViewMemo = memo(SimplifiedObjectView);

registerBuiltInView('uml', 'object', UMLObjectView);
registerBuiltInView('simplified', 'object', SimplifiedObjectViewMemo);

export { UMLObjectView as GenericObjectView };
