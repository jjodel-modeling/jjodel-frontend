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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import DynamicHandles from '../components/DynamicHandles';
import InlineEnumSelect from '../components/InlineEnumSelect';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { syncNodeLabel, syncUpdateFeatureValue } from '../sync/canvasToJjom';
import type { ObjectNodeData } from '../types';
import { NodeProblemIndicator } from '../problems/NodeProblemIndicator';
import { useIsHighlighted } from '../problems/useNodeProblems';

export type ObjectNodeType = Node<ObjectNodeData, 'objectNode'>;

function ObjectNode({ id, data, selected }: NodeProps<ObjectNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();

    // Live metaclass name + singleton flag from Redux (reacts to metamodel changes)
    const liveMetaclassInfo = useSelector((state: any) => {
        const classId = data.instanceOfClassId;
        if (!classId) return { name: null, isSingleton: false };
        const dClass = (state.idlookup?.[classId] as any);
        return { name: dClass?.name ?? null, isSingleton: !!dClass?.isSingleton };
    });
    const liveMetaclassName = liveMetaclassInfo.name;
    const isSingleton = liveMetaclassInfo.isSingleton;
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
            const typeObj = typeId ? (lookup[typeId] as any) : null;
            const typeName = typeObj?.name ?? '';
            // Check if type is an enumeration and encode literal names
            let enumLitStr = '';
            if (typeObj?.className === 'DEnumerator' && typeObj.literals) {
                const litNames: string[] = [];
                for (const litId of typeObj.literals) {
                    if (typeof litId !== 'string') continue;
                    const dLit = lookup[litId] as any;
                    if (dLit?.name) litNames.push(dLit.name);
                }
                if (litNames.length > 0) enumLitStr = litNames.join(',');
            }
            // encode: attrId;name;lowerBound;defaultValueLiteral;typeName;enumLiterals
            parts.push(`${attrId};${dAttr.name ?? ''};${dAttr.lowerBound ?? 0};${dAttr.defaultValueLiteral ?? ''};${typeName};${enumLitStr}`);
        }
        return parts.join('|');
    });

    const missingAttributes = useMemo(() => {
        if (!metaclassAttrSig) return [];
        const result: Array<{ id: string; name: string; defaultDisplay: string; enumLiterals?: Array<{ name: string; value: number }> }> = [];
        for (const entry of metaclassAttrSig.split('|')) {
            const [attrId, name, lbStr, defaultLiteral, typeName, enumLitStr] = entry.split(';');
            if (coveredAttrIds.has(attrId)) continue;
            const lb = parseInt(lbStr, 10);
            if (lb > 0) continue; // required — not a lazy placeholder
            // Parse enum literals if present
            let enumLiterals: Array<{ name: string; value: number }> | undefined;
            if (enumLitStr) {
                enumLiterals = enumLitStr.split(',').map((n, i) => ({ name: n, value: i }));
            }
            // Determine display value
            let defaultDisplay = defaultLiteral;
            if (!defaultDisplay) {
                if (enumLiterals && enumLiterals.length > 0) {
                    defaultDisplay = '-- Select --';
                } else {
                    const tn = typeName.toLowerCase();
                    if (tn === 'eint' || tn === 'eintegerobject' || tn === 'efloat' || tn === 'edouble' || tn === 'elong' || tn === 'eshort' || tn === 'ebyte') defaultDisplay = '0';
                    else if (tn === 'eboolean' || tn === 'ebooleanobject') defaultDisplay = 'false';
                    else defaultDisplay = '""';
                }
            }
            result.push({ id: attrId, name, defaultDisplay, enumLiterals });
        }
        return result;
    }, [metaclassAttrSig, coveredAttrIds]);

    const isProblemHighlighted = useIsHighlighted(id);

    // Header editing
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const lastCommittedName = useRef(data.label);

    // Feature value editing
    const [editingFeature, setEditingFeature] = useState<{
        id: string;
        featureName: string;
    } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Enum popover: tracks which feature ID has its popover open (null = none)
    const [openEnumId, setOpenEnumId] = useState<string | null>(null);

    useEffect(() => {
        if (data.label !== lastCommittedName.current) {
            setName(data.label);
            lastCommittedName.current = data.label;
        }
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
        if (name !== lastCommittedName.current) {
            lastCommittedName.current = name;
            editorContext?.takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, label: name } } : n
                )
            );
            syncNodeLabel(id, name);
        }
    }, [id, name, setNodes, editorContext]);

    const handleBlur = useCallback(() => {
        commitName();
    }, [commitName]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitName();
            } else if (e.key === 'Escape') {
                setName(lastCommittedName.current);
                setEditing(false);
            }
        },
        [commitName]
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

    const commitPlaceholderEdit = useCallback((attr: { id: string; name: string }) => {
        if (!editingFeature || editValue === '') {
            setEditingFeature(null);
            return;
        }
        editorContext?.takeSnapshot();
        // Add the feature to node data for immediate UI feedback
        setNodes(nds => nds.map(n => {
            if (n.id !== id) return n;
            const nodeData = n.data as ObjectNodeData;
            return {
                ...n,
                data: {
                    ...nodeData,
                    features: [
                        ...nodeData.features,
                        { id: attr.id, featureName: attr.name, featureKind: 'attribute' as const, value: editValue },
                    ],
                },
            };
        }));
        // Sync to JjOM model
        syncUpdateFeatureValue(id, attr.name, editValue);
        setEditingFeature(null);
    }, [editingFeature, editValue, id, setNodes, editorContext]);

    // Build ordered list of all editable slots for Tab navigation
    const allEditableSlots = useMemo(() => {
        const slots: Array<{ editId: string; featureName: string; value: string; isPlaceholder: boolean; placeholderAttr?: { id: string; name: string } }> = [];
        const attrs = data.features?.filter(f => f.featureKind === 'attribute') ?? [];
        for (const f of attrs) {
            slots.push({ editId: f.id, featureName: f.featureName, value: f.value, isPlaceholder: false });
        }
        for (const attr of missingAttributes) {
            slots.push({ editId: `placeholder_${attr.id}`, featureName: attr.name, value: '', isPlaceholder: true, placeholderAttr: attr });
        }
        return slots;
    }, [data.features, missingAttributes]);

    const advanceToNextSlot = useCallback((currentEditId: string) => {
        const idx = allEditableSlots.findIndex(s => s.editId === currentEditId);
        if (idx < 0 || idx >= allEditableSlots.length - 1) {
            setEditingFeature(null);
            return;
        }
        const next = allEditableSlots[idx + 1];
        setEditingFeature({ id: next.editId, featureName: next.featureName });
        setEditValue(next.isPlaceholder ? '' : next.value);
    }, [allEditableSlots]);

    const handleFeatureKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitFeatureEdit();
        } else if (e.key === 'Escape') {
            setEditingFeature(null);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const currentId = editingFeature?.id;
            commitFeatureEdit();
            if (currentId) advanceToNextSlot(currentId);
        }
    }, [commitFeatureEdit, editingFeature, advanceToNextSlot]);

    const handlePlaceholderKeyDown = useCallback((e: React.KeyboardEvent, attr: { id: string; name: string }) => {
        if (e.key === 'Enter') {
            commitPlaceholderEdit(attr);
        } else if (e.key === 'Escape') {
            setEditingFeature(null);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const currentId = `placeholder_${attr.id}`;
            commitPlaceholderEdit(attr);
            advanceToNextSlot(currentId);
        }
    }, [commitPlaceholderEdit, advanceToNextSlot]);

    // ── Render ───────────────────────────────────────────────────────

    const existingAttrs = data.features?.filter(f => f.featureKind === 'attribute') ?? [];
    const hasFeatures = existingAttrs.length > 0 || missingAttributes.length > 0;
    const isOrphan = !data.instanceOfClassId;

    return (
        <div className={`mm-node mm-object ${selected ? 'selected' : ''} ${isOrphan ? 'mm-object--orphan' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={140}
                minHeight={40}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <DynamicHandles nodeId={id} />

            {isSingleton && (
                <span className="singleton-badge">
                    <i className="bi bi-diamond-fill" />
                </span>
            )}

            <NodeProblemIndicator nodeId={id} />

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
                                {(() => {
                                    const hasEnum = feature.enumLiterals && feature.enumLiterals.length > 0;
                                    const isStaleEnum = hasEnum
                                        && feature.value != null && feature.value !== ''
                                        && !feature.enumLiterals!.some(l => l.name === feature.value);

                                    // Enum attributes: click to open popover (no inline <select>)
                                    if (hasEnum) {
                                        return (
                                            <span
                                                className={`mm-field__type mm-object__feature-value mm-field__enum-value${isStaleEnum ? ' mm-field__enum-stale' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); setOpenEnumId(openEnumId === feature.id ? null : feature.id); }}
                                                title={isStaleEnum ? `"${feature.value}" is no longer a valid enum literal` : 'Click to change'}
                                            >
                                                {isStaleEnum && <i className="bi bi-exclamation-triangle-fill mm-field__enum-stale-icon" />}
                                                {feature.value || '(none)'}
                                                <i className="bi bi-chevron-down mm-field__enum-chevron" />
                                                {openEnumId === feature.id && (
                                                    <InlineEnumSelect
                                                        value={feature.value}
                                                        enumName={feature.typeName ?? 'Enum'}
                                                        literals={feature.enumLiterals!}
                                                        isStale={!!isStaleEnum}
                                                        onChange={(val) => {
                                                            if (val !== feature.value) {
                                                                editorContext?.takeSnapshot();
                                                                setNodes(nds => nds.map(n => {
                                                                    if (n.id !== id) return n;
                                                                    const nd = n.data as ObjectNodeData;
                                                                    return { ...n, data: { ...nd, features: nd.features.map(f => f.id === feature.id ? { ...f, value: val } : f) } };
                                                                }));
                                                                syncUpdateFeatureValue(id, liveName, val);
                                                            }
                                                            setOpenEnumId(null);
                                                        }}
                                                        onClose={() => setOpenEnumId(null)}
                                                    />
                                                )}
                                            </span>
                                        );
                                    }

                                    // Non-enum attributes: existing inline edit behavior
                                    return editingFeature?.id === feature.id ? (
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
                                    );
                                })()}
                            </div>
                        )})}
                        {/* Lazy co-evolution: optional attributes not yet valorized */}
                        {missingAttributes.map((attr) => {
                            const placeholderId = `placeholder_${attr.id}`;
                            const isEditingThis = editingFeature?.id === placeholderId;
                            const hasEnumLits = attr.enumLiterals && attr.enumLiterals.length > 0;
                            return (
                                <div key={`ph_${attr.id}`} className={`mm-field mm-object__feature ${isEditingThis ? '' : 'mm-object__feature--placeholder'}`}>
                                    <span className="mm-field__name mm-object__feature-name">
                                        {attr.name}
                                    </span>
                                    <span className="mm-field__separator">=</span>
                                    {isEditingThis ? (
                                        hasEnumLits ? (
                                            <select
                                                className="mm-field__input mm-field__enum-select"
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => {
                                                    setEditValue(e.target.value);
                                                    if (e.target.value) {
                                                        // Auto-commit placeholder with selected enum value
                                                        const val = e.target.value;
                                                        editorContext?.takeSnapshot();
                                                        setNodes(nds => nds.map(n => {
                                                            if (n.id !== id) return n;
                                                            const nd = n.data as ObjectNodeData;
                                                            return { ...n, data: { ...nd, features: [...nd.features, { id: attr.id, featureName: attr.name, featureKind: 'attribute' as const, value: val, enumLiterals: attr.enumLiterals }] } };
                                                        }));
                                                        syncUpdateFeatureValue(id, attr.name, val);
                                                        setEditingFeature(null);
                                                    }
                                                }}
                                                onBlur={() => commitPlaceholderEdit(attr)}
                                                onKeyDown={(e) => handlePlaceholderKeyDown(e, attr)}
                                            >
                                                <option value="">-- Select --</option>
                                                {attr.enumLiterals!.map(lit => (
                                                    <option key={lit.name} value={lit.name}>{lit.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="mm-field__input"
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                onBlur={() => commitPlaceholderEdit(attr)}
                                                onKeyDown={(e) => handlePlaceholderKeyDown(e, attr)}
                                            />
                                        )
                                    ) : (
                                        <span
                                            className="mm-field__type mm-object__feature-value"
                                            onDoubleClick={() => {
                                                setEditingFeature({ id: placeholderId, featureName: attr.name });
                                                setEditValue('');
                                            }}
                                            onClick={() => {
                                                if (selected) {
                                                    setEditingFeature({ id: placeholderId, featureName: attr.name });
                                                    setEditValue('');
                                                }
                                            }}
                                        >
                                            {attr.defaultDisplay}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
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
