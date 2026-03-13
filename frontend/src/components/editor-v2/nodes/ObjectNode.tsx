/**
 * Editor V2 — ObjectNode: renders a DObject instance on the canvas.
 *
 * UML instance notation:
 * ┌─────────────────────────┐
 * │  objectName : ClassName │  ← header (underlined per UML convention)
 * ├─────────────────────────┤
 * │  attr1 = value1         │  ← attribute value (inline-editable)
 * │  attr2 = value2         │
 * └─────────────────────────┘
 *
 * Features:
 * - NodeResizer for resize handles
 * - DynamicHandles for connection ports (4 sides)
 * - Double-click on header → edit instance name
 * - Double-click on feature value → inline edit attribute value
 * - Auto-edit on drop from palette (data.autoEdit)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import DynamicHandles from '../components/DynamicHandles';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { syncNodeLabel, syncUpdateFeatureValue } from '../sync/canvasToJjom';
import type { ObjectNodeData } from '../types';

export type ObjectNodeType = Node<ObjectNodeData, 'objectNode'>;

function ObjectNode({ id, data, selected }: NodeProps<ObjectNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();

    // Live metaclass name from Redux (reacts to metamodel renames)
    const liveMetaclassName = useSelector((state: any) => {
        const classId = data.instanceOfClassId;
        if (!classId) return null;
        return (state.idlookup?.[classId] as any)?.name ?? null;
    });
    const metaclassName = liveMetaclassName
        ?? (data.instanceOfClassId ? data.instanceOfClassName : 'Orphan');

    // Live feature names from Redux: DValue.instanceof → DAttribute.name
    // Also collects the set of DAttribute IDs covered by instance features.
    // Serialized string signature to avoid new-object re-renders (same pattern as ClassNode)
    const liveFeatureNameSig = useSelector((state: any) => {
        const lookup = state.idlookup;
        if (!lookup || !data.features?.length) return '';
        const parts: string[] = [];
        for (const f of data.features) {
            const dValue = lookup[f.id];
            if (!dValue) continue;
            const attrId = dValue.instanceof;
            if (!attrId || typeof attrId !== 'string') continue;
            const dAttr = lookup[attrId];
            if (dAttr?.name != null) parts.push(`${f.id}:${attrId}:${dAttr.name}`);
        }
        return parts.join('|');
    });

    const { liveFeatureNameMap, coveredAttrIds } = useMemo(() => {
        const nameMap = new Map<string, string>();
        const covered = new Set<string>();
        if (!liveFeatureNameSig) return { liveFeatureNameMap: nameMap, coveredAttrIds: covered };
        for (const entry of liveFeatureNameSig.split('|')) {
            const first = entry.indexOf(':');
            const second = entry.indexOf(':', first + 1);
            if (first > 0 && second > first) {
                const fId = entry.slice(0, first);
                const attrId = entry.slice(first + 1, second);
                const name = entry.slice(second + 1);
                nameMap.set(fId, name);
                covered.add(attrId);
            }
        }
        return { liveFeatureNameMap: nameMap, coveredAttrIds: covered };
    }, [liveFeatureNameSig]);

    // Metaclass attributes from Redux — used for lazy co-evolution placeholders.
    // Reads all attributes of the metaclass; missing ones (not in coveredAttrIds)
    // are shown as muted placeholders with their default value.
    const metaclassAttrSig = useSelector((state: any) => {
        const lookup = state.idlookup;
        const classId = data.instanceOfClassId;
        if (!lookup || !classId) return '';
        const dClass = lookup[classId] as any;
        if (!dClass?.attributes) return '';
        const parts: string[] = [];
        for (const attrId of dClass.attributes) {
            if (typeof attrId !== 'string') continue;
            const dAttr = lookup[attrId] as any;
            if (!dAttr) continue;
            // Resolve type name for default value inference
            const typeId = typeof dAttr.type === 'string' ? dAttr.type : null;
            const typeName = typeId ? (lookup[typeId] as any)?.name ?? '' : '';
            // encode: attrId;name;lowerBound;defaultValueLiteral;typeName
            parts.push(`${attrId};${dAttr.name ?? ''};${dAttr.lowerBound ?? 0};${dAttr.defaultValueLiteral ?? ''};${typeName}`);
        }
        return parts.join('|');
    });

    const missingAttributes = useMemo(() => {
        if (!metaclassAttrSig) return [];
        const result: Array<{ id: string; name: string; defaultDisplay: string }> = [];
        for (const entry of metaclassAttrSig.split('|')) {
            const [attrId, name, lbStr, defaultLiteral, typeName] = entry.split(';');
            if (coveredAttrIds.has(attrId)) continue;
            const lb = parseInt(lbStr, 10);
            if (lb > 0) continue; // required — not a lazy placeholder
            // Determine display value
            let defaultDisplay = defaultLiteral;
            if (!defaultDisplay) {
                const tn = typeName.toLowerCase();
                if (tn === 'eint' || tn === 'eintegerobject' || tn === 'efloat' || tn === 'edouble' || tn === 'elong' || tn === 'eshort' || tn === 'ebyte') defaultDisplay = '0';
                else if (tn === 'eboolean' || tn === 'ebooleanobject') defaultDisplay = 'false';
                else defaultDisplay = '""';
            }
            result.push({ id: attrId, name, defaultDisplay });
        }
        return result;
    }, [metaclassAttrSig, coveredAttrIds]);

    // Header editing
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);

    // Feature value editing
    const [editingFeature, setEditingFeature] = useState<{
        id: string;
        featureName: string;
    } | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        setName(data.label);
    }, [data.label]);

    // Auto-edit mode for newly created nodes
    useEffect(() => {
        if (data.autoEdit) {
            setEditing(true);
            setNodes(nds => nds.map(n =>
                n.id === id ? { ...n, data: { ...n.data, autoEdit: undefined } } : n
            ));
        }
    }, [data.autoEdit, id, setNodes]);

    // ── Header name editing ──────────────────────────────────────────

    const handleDoubleClick = useCallback(() => {
        setEditing(true);
    }, []);

    const commitName = useCallback(() => {
        setEditing(false);
        if (name !== data.label) {
            editorContext?.takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, label: name } } : n
                )
            );
            syncNodeLabel(id, name);
        }
    }, [id, name, data.label, setNodes, editorContext]);

    const handleBlur = useCallback(() => {
        commitName();
    }, [commitName]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitName();
            } else if (e.key === 'Escape') {
                setName(data.label);
                setEditing(false);
            }
        },
        [commitName, data.label]
    );

    // ── Feature value editing ────────────────────────────────────────

    const startEditFeature = useCallback((
        featureId: string,
        featureName: string,
        currentValue: string,
    ) => {
        setEditingFeature({ id: featureId, featureName });
        setEditValue(currentValue);
    }, []);

    const commitFeatureEdit = useCallback(() => {
        if (!editingFeature) return;

        const feature = data.features?.find(f => f.id === editingFeature.id);
        if (feature && editValue !== feature.value) {
            editorContext?.takeSnapshot();
            setNodes(nds => nds.map(n => {
                if (n.id !== id) return n;
                const nodeData = n.data as ObjectNodeData;
                return {
                    ...n,
                    data: {
                        ...nodeData,
                        features: nodeData.features.map(f =>
                            f.id === editingFeature.id
                                ? { ...f, value: editValue }
                                : f
                        ),
                    },
                };
            }));
            syncUpdateFeatureValue(id, editingFeature.featureName, editValue);
        }
        setEditingFeature(null);
    }, [editingFeature, editValue, data.features, id, setNodes, editorContext]);

    const handleFeatureKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitFeatureEdit();
        } else if (e.key === 'Escape') {
            setEditingFeature(null);
        }
    }, [commitFeatureEdit]);

    // ── Render ───────────────────────────────────────────────────────

    const existingAttrs = data.features?.filter(f => f.featureKind === 'attribute') ?? [];
    const hasFeatures = existingAttrs.length > 0 || missingAttributes.length > 0;
    const isOrphan = !data.instanceOfClassId;

    return (
        <div className={`mm-node mm-object ${selected ? 'selected' : ''} ${isOrphan ? 'mm-object--orphan' : ''}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={140}
                minHeight={40}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <DynamicHandles nodeId={id} />

            {/* Header: objectName : ClassName — underlined per UML convention */}
            <div
                className="mm-node__header mm-object__header"
                onDoubleClick={handleDoubleClick}
                onClick={() => { if (selected && !editing) setEditing(true); }}
            >
                {editing ? (
                    <input
                        className="mm-node__input"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span className="mm-node__name mm-object__name">
                        <span className="mm-object__instance-name">{name}</span>
                        <span className="mm-object__separator"> : </span>
                        <span className="mm-object__class-name">{metaclassName}</span>
                    </span>
                )}
            </div>

            {/* Feature values (attributes) + lazy co-evolution placeholders */}
            {hasFeatures && (
                <div className="mm-node__body">
                    <div className="mm-node__fields">
                        {/* Existing (valorized) features */}
                        {existingAttrs.map((feature) => {
                            const liveName = liveFeatureNameMap.get(feature.id) ?? feature.featureName;
                            return (
                            <div key={feature.id} className="mm-field mm-object__feature">
                                <span className="mm-field__name mm-object__feature-name">
                                    {liveName}
                                </span>
                                <span className="mm-field__separator">=</span>
                                {editingFeature?.id === feature.id ? (
                                    <input
                                        className="mm-field__input"
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={commitFeatureEdit}
                                        onKeyDown={handleFeatureKeyDown}
                                    />
                                ) : (
                                    <span
                                        className="mm-field__type mm-object__feature-value"
                                        onDoubleClick={() => startEditFeature(feature.id, liveName, feature.value)}
                                        onClick={() => { if (selected) startEditFeature(feature.id, liveName, feature.value); }}
                                    >
                                        {feature.value != null ? String(feature.value) : '—'}
                                    </span>
                                )}
                            </div>
                        )})}
                        {/* Lazy co-evolution: optional attributes not yet valorized */}
                        {missingAttributes.map((attr) => (
                            <div key={`ph_${attr.id}`} className="mm-field mm-object__feature mm-object__feature--placeholder">
                                <span className="mm-field__name mm-object__feature-name">
                                    {attr.name}
                                </span>
                                <span className="mm-field__separator">=</span>
                                <span className="mm-field__type mm-object__feature-value">
                                    {attr.defaultDisplay}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty body */}
            {!hasFeatures && (
                <div className="mm-node__empty" />
            )}
        </div>
    );
}

export default ObjectNode;
