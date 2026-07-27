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
import { isNodeResizable, SHAPE_MIN_SIZE, defaultResizableForForm } from './nodeSizing';
import InlineEnumSelect from '../components/InlineEnumSelect';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useNodeHighlightClass } from '../contexts/HighlightContext';
import { syncNodeLabel, syncUpdateFeatureValue, syncIRCollapsedToJjom } from '../sync/canvasToJjom';
import { useLayoutAutosave } from '../hooks/useLayoutAutosave';
import type { ObjectNodeData } from '../types';
import { NodeProblemIndicator } from '../problems/NodeProblemIndicator';
import { useIsHighlighted } from '../problems/useNodeProblems';
import { useIRView } from '../viewpoint/ir/irResolve';
import { isMigratedDefaultView } from '../viewpoint/ir/irDefaults';
import type { VertexViewIR } from '../viewpoint/ir/irTypes';
import IRNodeContent from '../viewpoint/ir/IRNodeContent';
import { containmentChildren } from '../viewpoint/ir/irContainment';
import { isCollapsed, toggleCollapsed, useCollapseVersion } from '../viewpoint/ir/irCollapseState';
import '../viewpoint/ir/irDemoFixture'; // dev-only: registers window.__jjodelInstallIRDemo

export type ObjectNodeType = Node<ObjectNodeData, 'objectNode'>;

function ObjectNode({ id, data, selected }: NodeProps<ObjectNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const hlClass = useNodeHighlightClass(id);

    // IR view resolution (spike 2026-07-17): non-null only when the active
    // viewpoint declares an applicable IR view for this object's metaclass.
    const irResolution = useIRView(id, data.instanceOfClassId);
    // Delegation (spec v1.2 sez. 11 amendment): migrated classic-default views
    // render through the native branch below — parity with "no viewpoint" by
    // construction. The view stays in the resolution index; only who renders
    // it changes.
    const irDelegated = irResolution !== null && isMigratedDefaultView(irResolution.compiled);
    // Containment collapse state (Fase 2b) — cheap, unconditional (rules of hooks)
    useCollapseVersion();
    // Debounced project save after a persisted collapse toggle (discovery 2026-07-19)
    const { scheduleLayoutSave } = useLayoutAutosave();
    const irChildCount = useSelector((state: any) => {
        if (!irResolution || irResolution.compiled.kind !== 'graphVertex') return 0;
        return containmentChildren(state.idlookup ?? {}, irResolution.objectId).length;
    });

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

    if (irResolution && !irDelegated) {
        // IR render path: wrapper, resizer, handles and highlight class stay
        // identical (handle contract is node-type-agnostic); only the content
        // is produced by the interpreter. Read-only in the spike.
        // Resize affordance (Fase 2): a geometric shape (ellipse/circle/diamond)
        // mounts the resizer by default and may shrink below the label down to
        // SHAPE_MIN_SIZE; box-like forms stay content-hug UNLESS the view sets
        // `resizable` (emendamento 2026-07-27). The explicit flag wins over the
        // per-form default; `resizable: false` blocks resize on any shape (false is
        // not nullish → it wins the ??). `ir-resizable` marks the wrapper so the
        // scoped CSS neutralizer (irStyle.ts) lets rect/rounded shrink to the floor.
        const shapeForm = irResolution.compiled.form(irResolution.readCtx, irResolution.objectId);
        const hasGeometricShape = defaultResizableForForm(shapeForm);
        const resolvedResizable = (irResolution.compiled.ir as VertexViewIR).resizable;
        const canResize = resolvedResizable ?? hasGeometricShape;
        return (
            <div
                className={`mm-node mm-object ${selected ? 'selected' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass} ir-view-${irResolution.compiled.viewId}${canResize ? ' ir-resizable' : ''}`}
                data-viewid={irResolution.compiled.viewId}
            >
                {isNodeResizable('objectNode', canResize) && (
                    <NodeResizer
                        isVisible={selected}
                        minWidth={SHAPE_MIN_SIZE}
                        minHeight={SHAPE_MIN_SIZE}
                        keepAspectRatio={shapeForm === 'circle'}
                        lineClassName="node-resize-line"
                        handleClassName="node-resize-handle"
                    />
                )}
                <DynamicHandles nodeId={id} />
                {isSingleton && (
                    <span className="singleton-badge">
                        <i className="bi bi-diamond-fill" />
                    </span>
                )}
                <NodeProblemIndicator nodeId={id} />
                <IRNodeContent
                    compiled={irResolution.compiled}
                    objectId={irResolution.objectId}
                    vertexId={id}
                    readCtx={irResolution.readCtx}
                />
                {/* graphVertex containment (Fase 2b): collapse/expand chip */}
                {irResolution.compiled.kind === 'graphVertex'
                    && irResolution.compiled.containment?.collapsible
                    && irChildCount > 0 && (
                    <button
                        type="button"
                        className="ir-collapse-chip"
                        style={{ position: 'absolute', bottom: 2, right: 4, zIndex: 3 }}
                        title={isCollapsed(irResolution.objectId) ? 'Expand contained elements' : 'Collapse contained elements'}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapsed(irResolution.objectId);
                            // Persist the new collapse state on the container's DVertex
                            // (session store stays the runtime source; discovery 2026-07-19).
                            syncIRCollapsedToJjom(id, isCollapsed(irResolution.objectId));
                            scheduleLayoutSave();
                        }}
                    >
                        <i className={`bi ${isCollapsed(irResolution.objectId) ? 'bi-chevron-expand' : 'bi-chevron-contract'}`} />
                        {isCollapsed(irResolution.objectId) ? String(irChildCount) : null}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`mm-node mm-object ${selected ? 'selected' : ''} ${isOrphan ? 'mm-object--orphan' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass}`}>
            {isNodeResizable('objectNode') && (
                <NodeResizer
                    isVisible={selected}
                    minWidth={140}
                    minHeight={40}
                    lineClassName="node-resize-line"
                    handleClassName="node-resize-handle"
                />
            )}

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
