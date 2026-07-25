import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import ViewpointRenderer from '../viewpoint/ViewpointRenderer';
import DynamicHandles from '../components/DynamicHandles';
import { isNodeResizable } from './nodeSizing';
import InlineTypeSelect from '../components/InlineTypeSelect';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useNodeHighlightClass } from '../contexts/HighlightContext';
import {
    syncNodeLabel,
    syncAddAttribute,
    syncUpdateAttribute,
    syncAddOperation,
    syncUpdateOperation,
} from '../sync/canvasToJjom';
import type { ClassNodeData } from '../types';
import { createAttribute, createOperation } from '../types';
import { JjodelEvents } from '../../../events/registry';
import { TRANSACTION, SetFieldAction } from '../../../joiner';

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

// Re-export for backwards compatibility
export type { ClassNodeData } from '../types';

// Default horizontal gap (flow px) between the node right edge and a ghost-target
// chip when its drag offset is zero. Single source of truth for both the chip
// transform and the connector geometry. Mirrors the connector length the stub
// had before it became draggable.
const GHOST_TARGET_DEFAULT_GAP = 24;

function ClassNode({ id, data, selected, width, height }: NodeProps<ClassNodeType>) {
    const { setNodes, getViewport } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const hlClass = useNodeHighlightClass(id);
    // Currently-selected model element (canonical selection channel, mirrors
    // EditorV2.tsx). Used to mark the cross-MM ghost stub as selected when its
    // DReference is the selected element — independent of ReactFlow node selection.
    const selectedModelElement = useSelector(
        (s: any) => s?._lastSelected?.modelElement as string | undefined
    );

    const attributes = data.attributes ?? [];
    const operations = data.operations ?? [];
    // First iteration: render only a single external (cross-metamodel) parent.
    const ghost = data.ghostParents?.[0];
    // Cross-metamodel reference targets, rendered as in-node stubs on the right.
    const ghostTargets = data.ghostTargets ?? [];
    // Stable signature of the cross-MM stub set, used to re-measure connector
    // origins and chip sizes when stubs are added/removed or their text changes.
    const ghostSig = ghostTargets
        .map((g) => `${g.refName}:${g.targetName}:${g.targetMetamodel}:${g.cardinality}`)
        .join('|');

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const [dragOver, setDragOver] = useState(false);
    // Track the last name WE committed so we can distinguish our own writes
    // from external changes (e.g. Info panel rename) and avoid a sync loop.
    const lastCommittedName = useRef(data.label);

    // Inline editing for attributes and operations
    const [editingField, setEditingField] = useState<{
        id: string;
        field: 'name' | 'type' | 'returnType';
        kind: 'attr' | 'op';
    } | null>(null);
    const [editValue, setEditValue] = useState('');

    // === Ghost-target drag (in-session offset only; NOT persisted) ===
    // Each cross-metamodel stub chip can be dragged out of crowded areas. The
    // offset is keyed by gt.refName (unique among a class's references, and all
    // chips live in this one ClassNode) and lives only in local state — it
    // resets on reload, like AnchorConfig. No DVertex / D-layer write.
    // Seed once at mount from the persisted offsets carried on each ghost target
    // (D-layer DVertex.ghostOffsets, keyed by refId, mapped back to refName here).
    // State stays keyed by refName; do NOT add an effect that re-syncs from data.
    const [ghostOffsets, setGhostOffsets] = useState<Record<string, { dx: number; dy: number }>>(
        () => {
            const init: Record<string, { dx: number; dy: number }> = {};
            (data.ghostTargets ?? []).forEach(gt => { if (gt.offset) init[gt.refName] = gt.offset; });
            return init;
        }
    );
    const ghostDragRef = useRef<{ refName: string; startX: number; startY: number; baseDx: number; baseDy: number } | null>(null);
    // True once a chip drag has moved past the click threshold, so a real
    // reposition drag does not also fire a select on the trailing click.
    const ghostMovedRef = useRef(false);

    // Persist the by-refName offsets to the source DVertex as a by-refId map.
    // Mirrors syncPositionToJjom (canvasToJjom.ts): TRANSACTION + SetFieldAction.
    const persistGhostOffsets = useCallback((byRefName: Record<string, { dx: number; dy: number }>) => {
        const map: { [refId: string]: { dx: number; dy: number } } = {};
        for (const [refName, off] of Object.entries(byRefName)) {
            const refId = data.ghostTargets?.find(gt => gt.refName === refName)?.refId;
            if (refId) map[refId] = off;
        }
        TRANSACTION('persist ghost offset', () => { SetFieldAction.new(id as any, 'ghostOffsets' as any, map, undefined, false); });
    }, [id, data.ghostTargets]);

    const onGhostPointerDown = useCallback((e: React.PointerEvent, refName: string) => {
        e.stopPropagation();   // do not let the press start a node drag / pan
        ghostMovedRef.current = false;   // reset click-vs-drag tracking
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
        const cur = ghostOffsets[refName] ?? { dx: 0, dy: 0 };
        ghostDragRef.current = { refName, startX: e.clientX, startY: e.clientY, baseDx: cur.dx, baseDy: cur.dy };
    }, [ghostOffsets]);

    const onGhostPointerMove = useCallback((e: React.PointerEvent) => {
        const d = ghostDragRef.current;
        if (!d) return;
        // Screen-px travel from the press: past ~4px this is a drag, not a click.
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4) ghostMovedRef.current = true;
        const zoom = getViewport().zoom || 1;   // screen px -> flow px
        const dx = d.baseDx + (e.clientX - d.startX) / zoom;
        const dy = d.baseDy + (e.clientY - d.startY) / zoom;
        setGhostOffsets(prev => ({ ...prev, [d.refName]: { dx, dy } }));
    }, [getViewport]);

    const onGhostPointerUp = useCallback((e: React.PointerEvent) => {
        const d = ghostDragRef.current;
        if (d) {
            const zoom = getViewport().zoom || 1;
            const dx = d.baseDx + (e.clientX - d.startX) / zoom;
            const dy = d.baseDy + (e.clientY - d.startY) / zoom;
            const next = { ...ghostOffsets, [d.refName]: { dx, dy } };
            setGhostOffsets(next);
            persistGhostOffsets(next);
        }
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
        ghostDragRef.current = null;
    }, [ghostOffsets, getViewport, persistGhostOffsets]);

    // Double-click resets a chip to its default anchored position.
    const onGhostReset = useCallback((refName: string) => {
        if (!ghostOffsets[refName]) return;
        const next = { ...ghostOffsets };
        delete next[refName];
        setGhostOffsets(next);
        persistGhostOffsets(next);
    }, [ghostOffsets, persistGhostOffsets]);

    // === Ghost-parent drag (mirrors ghost-target, keyed by super-type DClass id) ===
    // The cross-metamodel parent chip can be dragged out of crowded areas; the
    // offset persists to the source DVertex (D-layer DVertex.ghostParentOffsets,
    // keyed by parent id) — a SEPARATE field from ghostOffsets so the parent and
    // target persists never clobber each other. Seed once at mount from the
    // persisted offset carried on each ghost parent. State stays keyed by parent
    // id; do NOT add an effect that re-syncs from data.
    const [ghostParentOffsets, setGhostParentOffsets] = useState<Record<string, { dx: number; dy: number }>>(
        () => {
            const init: Record<string, { dx: number; dy: number }> = {};
            (data.ghostParents ?? []).forEach(p => { if (p.offset) init[p.id] = p.offset; });
            return init;
        }
    );
    const ghostParentDragRef = useRef<{ id: string; startX: number; startY: number; baseDx: number; baseDy: number } | null>(null);

    // Persist the by-id parent offsets to the source DVertex. The state is already
    // id-keyed, so no name↔id bridge — write the map directly. Drag UI handler →
    // TRANSACTION is the correct context (not sync-adjacent like useJjomSync).
    const persistGhostParentOffsets = useCallback((map: Record<string, { dx: number; dy: number }>) => {
        TRANSACTION('persist ghost parent offset', () => { SetFieldAction.new(id as any, 'ghostParentOffsets' as any, map, undefined, false); });
    }, [id]);

    const onGhostParentPointerDown = useCallback((e: React.PointerEvent, parentId: string) => {
        e.stopPropagation();   // do not let the press start a node drag / pan
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
        const cur = ghostParentOffsets[parentId] ?? { dx: 0, dy: 0 };
        ghostParentDragRef.current = { id: parentId, startX: e.clientX, startY: e.clientY, baseDx: cur.dx, baseDy: cur.dy };
    }, [ghostParentOffsets]);

    const onGhostParentPointerMove = useCallback((e: React.PointerEvent) => {
        const d = ghostParentDragRef.current;
        if (!d) return;
        const zoom = getViewport().zoom || 1;   // screen px -> flow px
        const dx = d.baseDx + (e.clientX - d.startX) / zoom;
        const dy = d.baseDy + (e.clientY - d.startY) / zoom;
        setGhostParentOffsets(prev => ({ ...prev, [d.id]: { dx, dy } }));
    }, [getViewport]);

    const onGhostParentPointerUp = useCallback((e: React.PointerEvent) => {
        const d = ghostParentDragRef.current;
        if (d) {
            const zoom = getViewport().zoom || 1;
            const dx = d.baseDx + (e.clientX - d.startX) / zoom;
            const dy = d.baseDy + (e.clientY - d.startY) / zoom;
            const next = { ...ghostParentOffsets, [d.id]: { dx, dy } };
            setGhostParentOffsets(next);
            persistGhostParentOffsets(next);
        }
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
        ghostParentDragRef.current = null;
    }, [ghostParentOffsets, getViewport, persistGhostParentOffsets]);

    // Double-click resets the parent chip to its default anchored position.
    const onGhostParentReset = useCallback((parentId: string) => {
        if (!ghostParentOffsets[parentId]) return;
        const next = { ...ghostParentOffsets };
        delete next[parentId];
        setGhostParentOffsets(next);
        persistGhostParentOffsets(next);
    }, [ghostParentOffsets, persistGhostParentOffsets]);

    // Node root + per-connector SVG refs + per-chip DOM refs, and the measured
    // per-stub geometry in flow px: the connector origin's vertical offset from
    // the node top (ghostOriginY = Δ) and the chip box size (ghostChipSize).
    const rootRef = useRef<HTMLDivElement>(null);
    const ghostConnectorRefs = useRef<Map<string, SVGSVGElement>>(new Map());
    const ghostChipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [ghostOriginY, setGhostOriginY] = useState<Record<string, number>>({});
    const [ghostChipSize, setGhostChipSize] = useState<Record<string, { w: number; h: number }>>({});

    // Measure each connector origin and chip box, relative to the node, in flow
    // px. The connector origin sits at the chip-row level (CSS top:50% of the
    // item), near the node top and varying per stacked stub — NOT the node
    // mid-height — so cy = H/2 − originY. The chip size feeds the chip-border
    // clip of the arrowhead. Both are stable under chip drag (translate does not
    // resize, and the SVG top-left anchor does not move) and under node height
    // changes (the stub is top-anchored), so we re-measure only when the stub
    // set or its text changes (ghostSig).
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const zoom = getViewport().zoom || 1;
        const nodeTop = root.getBoundingClientRect().top;
        const nextOrigin: Record<string, number> = {};
        const nextChip: Record<string, { w: number; h: number }> = {};
        for (const gt of ghostTargets) {
            const svg = ghostConnectorRefs.current.get(gt.refName);
            if (svg) nextOrigin[gt.refName] = (svg.getBoundingClientRect().top - nodeTop) / zoom;
            const chipEl = ghostChipRefs.current.get(gt.refName);
            if (chipEl) {
                const r = chipEl.getBoundingClientRect();
                nextChip[gt.refName] = { w: r.width / zoom, h: r.height / zoom };
            }
        }
        setGhostOriginY((prev) => {
            const keys = Object.keys(nextOrigin);
            if (keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === nextOrigin[k])) {
                return prev;
            }
            return nextOrigin;
        });
        setGhostChipSize((prev) => {
            const keys = Object.keys(nextChip);
            if (keys.length === Object.keys(prev).length && keys.every((k) => prev[k]?.w === nextChip[k].w && prev[k]?.h === nextChip[k].h)) {
                return prev;
            }
            return nextChip;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ghostSig, getViewport]);

    // Sync name from model only when changed externally (not by our own commit).
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

    // Start editing an attribute or operation field
    const startEditField = useCallback((
        itemId: string,
        field: 'name' | 'type' | 'returnType',
        currentValue: string,
        kind: 'attr' | 'op',
    ) => {
        setEditingField({ id: itemId, field, kind });
        setEditValue(currentValue);
    }, []);

    // Commit attribute or operation edit
    const commitFieldEdit = useCallback(() => {
        if (!editingField) return;

        if (editingField.kind === 'attr') {
            const attr = data.attributes?.find(a => a.id === editingField.id);
            if (attr && editValue !== attr[editingField.field as 'name' | 'type']) {
                editorContext?.takeSnapshot();
                setNodes(nds => nds.map(n => {
                    if (n.id !== id) return n;
                    const nodeData = n.data as ClassNodeData;
                    return {
                        ...n,
                        data: {
                            ...nodeData,
                            attributes: nodeData.attributes.map(a =>
                                a.id === editingField.id
                                    ? { ...a, [editingField.field]: editValue }
                                    : a
                            ),
                        },
                    };
                }));
                syncUpdateAttribute(editingField.id, editingField.field, editValue, id);
            }
        } else {
            const op = data.operations?.find(o => o.id === editingField.id);
            if (op && editValue !== op[editingField.field as 'name' | 'returnType']) {
                editorContext?.takeSnapshot();
                setNodes(nds => nds.map(n => {
                    if (n.id !== id) return n;
                    const nodeData = n.data as ClassNodeData;
                    return {
                        ...n,
                        data: {
                            ...nodeData,
                            operations: (nodeData.operations || []).map(o =>
                                o.id === editingField.id
                                    ? { ...o, [editingField.field]: editValue }
                                    : o
                            ),
                        },
                    };
                }));
                syncUpdateOperation(editingField.id, editingField.field, editValue, id);
            }
        }
        setEditingField(null);
    }, [editingField, editValue, data.attributes, data.operations, id, setNodes, editorContext]);

    const handleFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitFieldEdit();
        } else if (e.key === 'Escape') {
            setEditingField(null);
        }
    }, [commitFieldEdit]);

    // Select a child element (attribute/operation) in the Properties panel
    const handleChildClick = useCallback((childId: string) => {
        editorContext?.selectChildElement?.(childId);
    }, [editorContext]);

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
                setName(data.label);
                setEditing(false);
            }
        },
        [commitName, data.label]
    );

    // Drop handler - accept attribute/operation from palette
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/reactflow')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent canvas drop
        const itemType = e.dataTransfer.getData('application/reactflow');

        if (itemType === 'attribute') {
            editorContext?.takeSnapshot();
            const newAttr = createAttribute();
            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, attributes: [...(n.data as ClassNodeData).attributes, newAttr] } }
                    : n
            ));
            syncAddAttribute(id);
            // Auto-focus the new attribute name
            setEditingField({ id: newAttr.id, field: 'name', kind: 'attr' });
            setEditValue(newAttr.name);
        }

        if (itemType === 'operation') {
            editorContext?.takeSnapshot();
            const newOp = createOperation();
            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, operations: [...((n.data as ClassNodeData).operations || []), newOp] } }
                    : n
            ));
            syncAddOperation(id);
        }

        setDragOver(false);
    }, [id, setNodes, editorContext]);

    // Viewpoint rendering
    if (data.jsxString) {
        return (
            <div className={`mm-node mm-class viewpoint-wrapper ${selected ? 'selected' : ''} ${hlClass}`}>
                {isNodeResizable('classNode') && (
                    <NodeResizer
                        isVisible={selected}
                        minWidth={120}
                        minHeight={60}
                        lineClassName="node-resize-line"
                        handleClassName="node-resize-handle"
                    />
                )}
                <DynamicHandles nodeId={id} />
                <ViewpointRenderer jsxString={data.jsxString} context={data} />
            </div>
        );
    }

    const notation = editorContext?.notation ?? 'uml';
    const isAbstract = data.isAbstract ?? false;
    const isSingleton = data.isSingleton ?? false;
    const hasContent = attributes.length > 0 || operations.length > 0;
    const showBody = notation !== 'compact';

    // Format bounds for display
    const formatBounds = (lower: number, upper: number): string | null => {
        if (lower === 0 && upper === 1) return null; // Default, no display
        if (lower === 1 && upper === 1) return null; // Required single, no display
        if (upper === -1) return `[${lower}..*]`;
        if (lower === upper) return `[${lower}]`;
        return `[${lower}..${upper}]`;
    };

    // --- Ghost-parent connector geometry (follows the dragged chip) ---
    // Connector-local coords = the 12x18 viewBox (1 unit = 1 flow px).
    // (6,18) = node-top-center (node-end, stays pinned); (6,1) = chip-bottom apex
    // at rest (= the old static apex). Same offset that drives the chip transform.
    const gpOff = ghost ? (ghostParentOffsets[ghost.id] ?? { dx: 0, dy: 0 }) : { dx: 0, dy: 0 };
    const gpStartX = 6, gpStartY = 18;                       // node-end, fixed
    const gpApexX = 6 + gpOff.dx, gpApexY = 1 + gpOff.dy;    // chip-end, follows drag
    const GP_TL = 7, GP_TW = 8;                              // triangle length / base width (from static)
    const gpAx = gpApexX - gpStartX, gpAy = gpApexY - gpStartY;
    const gpDegenerate = gpAx === 0 && gpAy === 0;           // chip dragged onto the node-end
    const gpAng = Math.atan2(gpAy, gpAx);
    const gpCos = Math.cos(gpAng), gpSin = Math.sin(gpAng);
    const gpBaseCx = gpApexX - GP_TL * gpCos, gpBaseCy = gpApexY - GP_TL * gpSin;
    const gpPx = -gpSin, gpPy = gpCos;                       // axis perpendicular
    const gpB1x = gpBaseCx + (GP_TW / 2) * gpPx, gpB1y = gpBaseCy + (GP_TW / 2) * gpPy;
    const gpB2x = gpBaseCx - (GP_TW / 2) * gpPx, gpB2y = gpBaseCy - (GP_TW / 2) * gpPy;
    const gpTriangle = `${gpApexX.toFixed(1)},${gpApexY.toFixed(1)} ${gpB1x.toFixed(1)},${gpB1y.toFixed(1)} ${gpB2x.toFixed(1)},${gpB2y.toFixed(1)}`;

    return (
        <div
            ref={rootRef}
            className={`mm-node mm-class ${selected ? 'selected' : ''} ${isAbstract ? 'abstract' : ''} ${isSingleton ? 'singleton' : ''} ${dragOver ? 'drop-target' : ''} ${hlClass}`}
            onDragOver={(e) => { handleDragOver(e); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            {isNodeResizable('classNode') && (
                <NodeResizer
                    isVisible={selected}
                    minWidth={140}
                    minHeight={40}
                    lineClassName="node-resize-line"
                    handleClassName="node-resize-handle"
                />
            )}

            <DynamicHandles nodeId={id} />

            {/* Ghost parent: cross-metamodel extends drawn as an in-node overlay
                (dashed chip + UML generalization arc), not a real ReactFlow edge. */}
            {ghost && (
                <div
                    className="ghost-parent-stub"
                    data-ghost-parent-id={ghost.id}
                    title={ghost.fullname}
                >
                    {/* Draggable unit: the chip moves via an inline transform; the
                        connector below is computed and follows the dragged chip
                        (its node-end stays pinned at node-top-center). `nodrag`
                        stops ReactFlow from panning the node on press. */}
                    <div
                        className="ghost-parent-stub__draggable nodrag"
                        style={{ transform: `translate(${ghostParentOffsets[ghost.id]?.dx ?? 0}px, ${ghostParentOffsets[ghost.id]?.dy ?? 0}px)` }}
                    >
                        <div
                            className="ghost-parent-stub__chip"
                            title={ghost.fullname}
                            onPointerDown={(e) => onGhostParentPointerDown(e, ghost.id)}
                            onPointerMove={onGhostParentPointerMove}
                            onPointerUp={onGhostParentPointerUp}
                            onDoubleClick={() => onGhostParentReset(ghost.id)}
                        >
                            <span className="ghost-parent-stub__name">{ghost.name}</span>
                            <span className="ghost-parent-stub__mm">{ghost.metamodelName}</span>
                        </div>
                    </div>
                    <svg className="ghost-parent-stub__connector" viewBox="0 0 12 18" aria-hidden="true">
                        {!gpDegenerate && (
                            <>
                                <line
                                    x1={gpStartX} y1={gpStartY}
                                    x2={gpBaseCx.toFixed(1)} y2={gpBaseCy.toFixed(1)}
                                    stroke="var(--color-canvas-accent)" strokeWidth="1.2"
                                />
                                <polygon
                                    points={gpTriangle}
                                    fill="none" stroke="var(--color-canvas-accent)"
                                    strokeWidth="1.2" strokeLinejoin="round"
                                />
                            </>
                        )}
                    </svg>
                </div>
            )}

            {/* Ghost targets: cross-metamodel references drawn as in-node
                overlays (association arc + dashed chip on the right), not real
                ReactFlow edges. The leftover self-loop edge is suppressed in
                jjomEdgeToRFEdge. The chip (label + chip = one unit) is draggable
                to declutter the canvas; the connector stays glued to the node
                right edge and follows the dragged chip. Offset is in-session only. */}
            {ghostTargets.length > 0 && (
                <div className="ghost-target-stub">
                    {ghostTargets.map((gt, i) => {
                        const off = ghostOffsets[gt.refName] ?? { dx: 0, dy: 0 };
                        const endX = GHOST_TARGET_DEFAULT_GAP + off.dx;   // chip left edge, x
                        const endY = off.dy;                              // chip vertical center, y
                        // The connector origin (0,0) sits on the node right edge at the
                        // chip-row level (CSS left:0; top:50% of the item) — NOT the node
                        // mid-height. ghostOriginY[refName] is the measured distance (flow
                        // px) from the node top down to that origin (per stacked stub);
                        // fall back to H/2 (origin ≈ node center) until measured.
                        const W = width ?? 180;
                        const H = height ?? 80;
                        const dY = ghostOriginY[gt.refName] ?? (H / 2);
                        // Node box in connector-local coords. Center (cx,cy): cy = H/2 − Δ
                        // because the origin sits at the chip-row level, not the node
                        // mid-height (Δ measured per stub).
                        const cx = -W / 2;
                        const cy = H / 2 - dY;
                        const nhw = W / 2;
                        const nhh = H / 2;
                        // Chip box. (endX,endY) is the chip LEFT-CENTER (endX = left edge,
                        // endY = vertical center), so the chip center is +chipW/2 in x.
                        // chipW/chipH are measured per stub; until measured they are 0 and
                        // the chip-border clip is skipped (the arrowhead falls back to the
                        // left-center anchor — the pre-part-2 behaviour).
                        const chip = ghostChipSize[gt.refName];
                        const chipW = chip?.w ?? 0;
                        const chipH = chip?.h ?? 0;
                        const chw = chipW / 2;
                        const chh = chipH / 2;
                        const chipCx = endX + chw;
                        const chipCy = endY;
                        // Axis node-center → chip-center. Both endpoints are clipped to
                        // their box border along this axis (closed-form ray/rect), so the
                        // line leaves the node border facing the chip and the arrowhead
                        // lands on the chip border facing the node — from any drag position.
                        const dx = chipCx - cx;
                        const dy = chipCy - cy;
                        const degenerate = dx === 0 && dy === 0;
                        // Node border (toward the chip): clamp ≤1 so start never overshoots.
                        const sDen = Math.max(Math.abs(dx) / nhw, Math.abs(dy) / nhh);
                        const sScale = sDen > 0 ? Math.min(1, 1 / sDen) : 0;
                        const startX = cx + sScale * dx;
                        const startY = cy + sScale * dy;
                        // Chip border (toward the node, direction −d): only when measured.
                        const tDen = (chw > 0 && chh > 0) ? Math.max(Math.abs(dx) / chw, Math.abs(dy) / chh) : 0;
                        const tScale = tDen > 0 ? Math.min(1, 1 / tDen) : 0;
                        const endBorderX = chipCx - tScale * dx;
                        const endBorderY = chipCy - tScale * dy;
                        // Arrowhead at the chip border, pointing along the axis into the chip.
                        const ang = Math.atan2(dy, dx);
                        const AL = 6, AW = 4;
                        const cos = Math.cos(ang), sin = Math.sin(ang);
                        const blx = (endBorderX - AL * cos + AW * sin).toFixed(1);
                        const bly = (endBorderY - AL * sin - AW * cos).toFixed(1);
                        const brx = (endBorderX - AL * cos - AW * sin).toFixed(1);
                        const bry = (endBorderY - AL * sin + AW * cos).toFixed(1);
                        // Source-side UML marker by reference kind. The kind is read
                        // from the matching MetaReference already in props
                        // (data.references carries `kind`, keyed by name — the cross-MM
                        // ref appears there too), so no transformer/types change is needed.
                        // composition → filled diamond, aggregation → hollow diamond,
                        // association → none. The target arrowhead is unchanged in all cases.
                        const refKind = data.references?.find((r) => r.name === gt.refName)?.kind ?? 'association';
                        const hasDiamond = refKind === 'composition' || refKind === 'aggregation';
                        // Rhombus along the axis at the node border (B = startX,startY):
                        // T toward the chip, S1/S2 the side vertices. Same 3:2 proportions
                        // as the same-MM edge markers (UnifiedEdge). For comp/agg the line
                        // starts at T so it never shows through the (hollow) diamond.
                        const DL = 12, DW = 8;            // diamond length / width (flow px)
                        const perpX = -sin, perpY = cos;  // axis perpendicular
                        const dTx = startX + cos * DL, dTy = startY + sin * DL;
                        const dS1x = startX + cos * (DL / 2) + perpX * (DW / 2);
                        const dS1y = startY + sin * (DL / 2) + perpY * (DW / 2);
                        const dS2x = startX + cos * (DL / 2) - perpX * (DW / 2);
                        const dS2y = startY + sin * (DL / 2) - perpY * (DW / 2);
                        const diamondPoints = `${startX.toFixed(1)},${startY.toFixed(1)} ${dS1x.toFixed(1)},${dS1y.toFixed(1)} ${dTx.toFixed(1)},${dTy.toFixed(1)} ${dS2x.toFixed(1)},${dS2y.toFixed(1)}`;
                        const diamondFill = refKind === 'composition' ? 'var(--color-canvas-accent)' : 'var(--color-canvas-bg)';
                        const lineStartX = hasDiamond ? dTx : startX;
                        const lineStartY = hasDiamond ? dTy : startY;
                        return (
                            <div key={`${gt.refName}-${i}`} className="ghost-target-stub__item">
                                {/* Connector: absolute SVG whose (0,0) sits on the node
                                    right edge at the chip-row level (CSS left:0; top:50%).
                                    The line runs from the node border (startX,startY) along
                                    the center→chip ray to the chip (endX,endY).
                                    overflow:visible so it is never clipped. */}
                                <svg
                                    ref={(el) => {
                                        if (el) ghostConnectorRefs.current.set(gt.refName, el);
                                        else ghostConnectorRefs.current.delete(gt.refName);
                                    }}
                                    className="ghost-target-stub__connector"
                                    width={Math.max(endX + 8, 1)}
                                    height={Math.max(Math.abs(endY) + 8, 1)}
                                    aria-hidden="true"
                                >
                                    {!degenerate && (
                                        <>
                                            <line x1={lineStartX.toFixed(1)} y1={lineStartY.toFixed(1)} x2={endBorderX.toFixed(1)} y2={endBorderY.toFixed(1)} stroke="var(--color-canvas-accent)" strokeWidth="1.2" />
                                            <polyline points={`${blx},${bly} ${endBorderX.toFixed(1)},${endBorderY.toFixed(1)} ${brx},${bry}`} fill="none" stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
                                            {hasDiamond && (
                                                <polygon points={diamondPoints} fill={diamondFill} stroke="var(--color-canvas-accent)" strokeWidth="1.2" strokeLinejoin="round" />
                                            )}
                                        </>
                                    )}
                                </svg>
                                {/* Draggable unit: chip + label above it move together.
                                    `nodrag` stops ReactFlow from panning the node. */}
                                <div
                                    className="ghost-target-stub__draggable nodrag"
                                    style={{ transform: `translate(${endX}px, ${endY}px)` }}
                                    // Stop the press from reaching ReactFlow so a stub tap on the
                                    // label area does not select the parent node (the chip already
                                    // stops its own pointerdown for the reposition drag).
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        // Stop first: a tap must not bubble to onNodeClick / RF
                                        // node-selection, so the parent class shows no ring.
                                        // selectChildElement sets _lastSelected.modelElement = refId
                                        // independently (its own rAF), so the reference stays
                                        // selected and the panel is unaffected.
                                        e.stopPropagation();
                                        // A real reposition drag ends with a click — ignore it.
                                        if (ghostMovedRef.current) { ghostMovedRef.current = false; return; }
                                        if (!gt.refId) return;
                                        editorContext?.selectChildElement?.(gt.refId);
                                    }}
                                >
                                    <span className="ghost-target-stub__label">{gt.refName} {gt.cardinality}</span>
                                    <div
                                        ref={(el) => {
                                            if (el) ghostChipRefs.current.set(gt.refName, el);
                                            else ghostChipRefs.current.delete(gt.refName);
                                        }}
                                        className={`ghost-target-stub__chip${gt.refId && gt.refId === selectedModelElement ? ' ghost-target-stub__chip--selected' : ''}`}
                                        title={gt.targetFullname}
                                        onPointerDown={(e) => onGhostPointerDown(e, gt.refName)}
                                        onPointerMove={onGhostPointerMove}
                                        onPointerUp={onGhostPointerUp}
                                        onDoubleClick={() => onGhostReset(gt.refName)}
                                        // Right-click opens a single "Delete reference" item.
                                        // preventDefault blocks the native menu; stopPropagation
                                        // blocks the parent Class node's onNodeContextMenu bubble.
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!gt.refId) return;
                                            window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
                                                detail: { childId: gt.refId, childKind: 'ref', nodeId: id, x: e.clientX, y: e.clientY }
                                            }));
                                        }}
                                    >
                                        <span className="ghost-target-stub__name">{gt.targetName}</span>
                                        <span className="ghost-target-stub__mm">{gt.targetMetamodel}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Header — abstract classes get italic name via CSS (.abstract .mm-node__name) */}
            <div
                className="mm-node__header"
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
                    <span className="mm-node__name">{name}</span>
                )}
            </div>

            {/* Body with attributes and operations */}
            {showBody && hasContent && notation === 'er' && (
                <div className="mm-node__body mm-node__body--er">
                    <span className="mm-node__er-attrs">
                        {attributes.map(a => a.name).join(', ')}
                    </span>
                </div>
            )}

            {showBody && hasContent && notation !== 'er' && (
                <div className="mm-node__body">
                    {/* Attributes */}
                    {attributes.length > 0 && (
                        <div className="mm-node__fields">
                            {attributes.map((attr) => {
                                const bounds = formatBounds(attr.lowerBound ?? 0, attr.upperBound ?? 1);
                                return (
                                    <div key={attr.id} className="mm-field" onClick={() => handleChildClick(attr.id)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
                                                detail: { childId: attr.id, childKind: 'attr', nodeId: id, x: e.clientX, y: e.clientY }
                                            }));
                                        }}>
                                        {editingField?.id === attr.id && editingField.field === 'name' ? (
                                            <input
                                                className="mm-field__input"
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                onBlur={commitFieldEdit}
                                                onKeyDown={handleFieldKeyDown}
                                            />
                                        ) : (
                                            <span
                                                className="mm-field__name"
                                                onDoubleClick={() => startEditField(attr.id, 'name', attr.name, 'attr')}
                                                onClick={() => { if (selected) startEditField(attr.id, 'name', attr.name, 'attr'); }}
                                            >
                                                {attr.name}
                                            </span>
                                        )}
                                        <span className="mm-field__separator">:</span>
                                        {editingField?.id === attr.id && editingField.field === 'type' ? (
                                            <InlineTypeSelect
                                                value={editValue}
                                                onChange={(newType) => {
                                                    editorContext?.takeSnapshot();
                                                    setNodes(nds => nds.map(n => {
                                                        if (n.id !== id) return n;
                                                        const nodeData = n.data as ClassNodeData;
                                                        return {
                                                            ...n,
                                                            data: {
                                                                ...nodeData,
                                                                attributes: nodeData.attributes.map(a =>
                                                                    a.id === attr.id ? { ...a, type: newType } : a
                                                                ),
                                                            },
                                                        };
                                                    }));
                                                    syncUpdateAttribute(attr.id, 'type', newType, id);
                                                    setEditingField(null);
                                                }}
                                                onClose={() => setEditingField(null)}
                                            />
                                        ) : (
                                            <span
                                                className="mm-field__type"
                                                onDoubleClick={() => startEditField(attr.id, 'type', attr.type, 'attr')}
                                                onClick={() => { if (selected) startEditField(attr.id, 'type', attr.type, 'attr'); }}
                                            >
                                                {attr.type}
                                                <i className="bi bi-chevron-down mm-field__type-chevron" />
                                            </span>
                                        )}
                                        {bounds ? <span className="mm-field__bound">{bounds}</span> : <span />}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Operations separator */}
                    {attributes.length > 0 && operations.length > 0 && (
                        <div className="mm-node__separator" />
                    )}

                    {/* Operations */}
                    {operations.length > 0 && (
                        <div className="mm-node__fields">
                            {operations.map((op) => (
                                <div key={op.id} className="mm-field mm-operation" onClick={() => handleChildClick(op.id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
                                            detail: { childId: op.id, childKind: 'op', nodeId: id, x: e.clientX, y: e.clientY }
                                        }));
                                    }}>
                                    {editingField?.id === op.id && editingField.field === 'name' ? (
                                        <input
                                            className="mm-field__input"
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={commitFieldEdit}
                                            onKeyDown={handleFieldKeyDown}
                                        />
                                    ) : (
                                        <span
                                            className="mm-field__name"
                                            onDoubleClick={() => startEditField(op.id, 'name', op.name, 'op')}
                                            onClick={() => { if (selected) startEditField(op.id, 'name', op.name, 'op'); }}
                                        >
                                            {op.name}()
                                        </span>
                                    )}
                                    <span className="mm-field__separator">:</span>
                                    {editingField?.id === op.id && editingField.field === 'returnType' ? (
                                        <InlineTypeSelect
                                            value={editValue}
                                            onChange={(newType) => {
                                                editorContext?.takeSnapshot();
                                                setNodes(nds => nds.map(n => {
                                                    if (n.id !== id) return n;
                                                    const nodeData = n.data as ClassNodeData;
                                                    return {
                                                        ...n,
                                                        data: {
                                                            ...nodeData,
                                                            operations: (nodeData.operations || []).map(o =>
                                                                o.id === op.id ? { ...o, returnType: newType } : o
                                                            ),
                                                        },
                                                    };
                                                }));
                                                syncUpdateOperation(op.id, 'returnType', newType, id);
                                                setEditingField(null);
                                            }}
                                            onClose={() => setEditingField(null)}
                                        />
                                    ) : (
                                        <span
                                            className="mm-field__type"
                                            onDoubleClick={() => startEditField(op.id, 'returnType', op.returnType, 'op')}
                                            onClick={() => { if (selected) startEditField(op.id, 'returnType', op.returnType, 'op'); }}
                                        >
                                            {op.returnType}
                                            <i className="bi bi-chevron-down mm-field__type-chevron" />
                                        </span>
                                    )}
                                    <span />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty drop zone */}
            {showBody && !hasContent && (
                <div className="mm-node__empty">
                </div>
            )}
        </div>
    );
}

export default ClassNode;
