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

import { Fragment, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { NodeResizer, useReactFlow, useStore, type NodeProps, type Node } from '@xyflow/react';
import DynamicHandles from '../components/DynamicHandles';
import { isNodeResizable, SHAPE_MIN_SIZE, defaultResizableForForm, keepAspectRatioForForm } from './nodeSizing';
import InlineEnumSelect from '../components/InlineEnumSelect';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useNodeHighlightClass } from '../contexts/HighlightContext';
import { syncNodeLabel, syncUpdateFeatureValue, syncIRCollapsedToJjom } from '../sync/canvasToJjom';
import { useLayoutAutosave } from '../hooks/useLayoutAutosave';
import type { ObjectNodeData } from '../types';
import { NodeProblemIndicator } from '../problems/NodeProblemIndicator';
import { useIsHighlighted } from '../problems/useNodeProblems';
import { useIRView, useIRViewpointActive } from '../viewpoint/ir/irResolve';
import { isMigratedDefaultView } from '../viewpoint/ir/irDefaults';
import type { VertexViewIR } from '../viewpoint/ir/irTypes';
import IRNodeContent from '../viewpoint/ir/IRNodeContent';
import { containmentChildren } from '../viewpoint/ir/irContainment';
import { isCollapsed, toggleCollapsed, useCollapseVersion } from '../viewpoint/ir/irCollapseState';
import { isSimActive, useSimVersion } from '../sim/simRunState';
import { entityLetter } from '../../../common/entityMeta';
import { store } from '../../../joiner';
import {
    resolveInstanceNodeStyle,
    instanceNodeChrome,
    emptySlotsLabel,
} from './instanceNodeStyle';
import { detectValueRenderer, type RendererDecision } from './valueRenderer';
import {
    resolveInstanceShape,
    firstAbstractDirectSuperclass,
    readDirectSuperclasses,
    readIsSingleton,
    readSingletonInstanceInfo,
    type SingletonLabelParts,
} from './singletonShape';
import SingletonPill from './SingletonPill';
import type { FeatureValueRow } from '../types';
import '../viewpoint/ir/irDemoFixture'; // dev-only: registers window.__jjodelInstallIRDemo
import './instanceNode.scss';

export type ObjectNodeType = Node<ObjectNodeData, 'objectNode'>;

/**
 * Chips rendered before the `+k` overflow affordance. The handoff leaves the
 * threshold open ("above ~4 chips") and states the requirement that decides it:
 * a collection must not grow the node unbounded.
 */
const MAX_CHIPS = 4;

/** One row of the compartment, after the renderer has been decided. */
interface SlotRow {
    key: string;
    name: string;
    /** The model slot, absent on a lazy co-evolution placeholder. */
    feature?: FeatureValueRow;
    /** The metaclass attribute this row stands in for, when it has no slot yet. */
    placeholder?: { id: string; name: string; defaultDisplay: string; enumLiterals?: Array<{ name: string; value: number }> };
    decision: RendererDecision;
    values: string[];
    /** `[n]` for a multi-valued slot: the actual count held, not the bound. */
    cardinality: string | null;
    /** The target is also drawn as an edge on this canvas. */
    hasEdge: boolean;
    isEmpty: boolean;
}

function ObjectNode({ id, data, selected }: NodeProps<ObjectNodeType>) {
    const { setNodes, getNodes, setCenter, getZoom } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const hlClass = useNodeHighlightClass(id);

    // ir-sized (Fase 2, 2026-07-28): true when the node carries an EXPLICIT size
    // (top-level width/height set by NodeResizer or size propagation — the same
    // channel; resetNodeSize removes them), NOT the measured size. Gates the
    // fill-neutralizer (irStyle.ts) so enabling `resizable` alone does not collapse
    // the box — only an actual size makes it fill the RF box.
    const hasExplicitSize = useStore((s) => {
        const n = s.nodeLookup.get(id);
        return n?.width != null && n?.height != null;
    });

    // IR view resolution (spike 2026-07-17): non-null only when the active
    // viewpoint declares an applicable IR view for this object's metaclass.
    const irResolution = useIRView(id, data.instanceOfClassId);
    // Is an IR viewpoint active at all? Only then does a null resolution mean "this
    // metaclass is not rendered by the viewpoint" (neutral node below); with no IR
    // viewpoint, or a wildcard one, the object keeps rendering in full.
    const irViewpointActive = useIRViewpointActive();
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

    // Live metaclass name from Redux (reacts to metamodel changes)
    const liveMetaclassInfo = useSelector((state: any) => {
        const classId = data.instanceOfClassId;
        if (!classId) return { name: null };
        const dClass = (state.idlookup?.[classId] as any);
        return { name: dClass?.name ?? null };
    });
    const liveMetaclassName = liveMetaclassInfo.name;
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

    // Which reference slots of THIS node are also drawn as an edge. Serialized to
    // a string so the selector returns a stable value: an array would be a new
    // object on every store tick and would re-render the node continuously.
    const edgeRefSig = useStore((s) => {
        const names: string[] = [];
        for (const e of s.edges) {
            if (e.source !== id) continue;
            const rn = (e.data as { referenceName?: unknown } | undefined)?.referenceName;
            if (typeof rn === 'string') names.push(rn);
        }
        return names.sort().join('|');
    });
    const edgeRefNames = useMemo(
        () => new Set(edgeRefSig ? edgeRefSig.split('|') : []),
        [edgeRefSig],
    );

    const isProblemHighlighted = useIsHighlighted(id);

    // Simulation run-state (R-SIM-3): the singleton is keyed on the DObject id,
    // this component on the vertex id — `idlookup[vertexId].model` is the map
    // (same read as irResolve.ts:55). Both hooks unconditional (rules of hooks).
    const simObjectId = useSelector((state: any) => state.idlookup?.[id]?.model ?? null);
    // Also the free invalidation channel for `marked` conditionals of an already
    // resolved IR view (R5, discovery 2026-08-18): retiring sim-active (R-MK-8)
    // must first verify that the M1b channel covers this path.
    useSimVersion();
    const isSimActiveNode = typeof simObjectId === 'string' && isSimActive(simObjectId);

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

    // Per-node runtime state of the handoff: local, not persisted.
    // `emptyRowsExpanded` only means anything under emptyBehavior = "collapse".
    const [emptyRowsExpanded, setEmptyRowsExpanded] = useState(false);
    // Which collections have had their `+k` chip clicked open.
    const [expandedChips, setExpandedChips] = useState<ReadonlySet<string>>(() => new Set());

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

    // ── Reference navigation ─────────────────────────────────────────────────

    /**
     * Select the object a reference points at, and bring it into view. The pill
     * is the affordance that reaches the target even when it is off-canvas.
     *
     * The mapping target DObject → vertex is only needed on click, so it is read
     * from the store here rather than subscribed to: `idlookup[vertexId].model`
     * is the DObject of a vertex (same read as irResolve.ts), and scanning the
     * rendered nodes once per click is cheaper than every node on the canvas
     * holding a subscription to the whole lookup.
     */
    const revealReferenceTarget = useCallback((targetObjectId: string) => {
        const lookup = (store.getState() as { idlookup?: Record<string, { model?: unknown }> }).idlookup ?? {};
        const nodes = getNodes();
        const target = nodes.find((n) => lookup[n.id]?.model === targetObjectId);
        if (!target) return;

        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === target.id })));

        const w = target.measured?.width ?? target.width ?? 0;
        const h = target.measured?.height ?? target.height ?? 0;
        setCenter(
            target.position.x + w / 2,
            target.position.y + h / 2,
            { zoom: getZoom(), duration: 300 },
        );
    }, [getNodes, setNodes, setCenter, getZoom]);

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

    // ── Singleton facts, live from Redux ─────────────────────────────
    //
    // Two questions, both answered off `idlookup` rather than off the node data:
    // is THIS instance's metaclass a singleton (and what abstract superclass
    // does it name), and which of its REFERENCE TARGETS draw as pills. Reading
    // them live is what makes the node react to the singleton toggle and to a
    // superclass added after mount — `refTargets` carries only id and name, and
    // the transformer that fills it does not re-run on a metamodel change.
    //
    // Serialized signature for the usual reason (same pattern as
    // `liveFeatureNameSig` above): a fresh object every render would re-render
    // on every unrelated store write.
    const singletonSig = useSelector((state: any) => {
        const lookup = state.idlookup;
        if (!lookup) return '';

        // `self` carries the flag and the superclass NAME only. The shape is not
        // decided here: it needs `valuedSlotCount`, which comes from the slot
        // rows below and must not be counted a second time from another source.
        const ownSuper = firstAbstractDirectSuperclass(
            readDirectSuperclasses(lookup, data.instanceOfClassId),
        );
        const parts: string[] = [
            `self;${readIsSingleton(lookup, data.instanceOfClassId) ? '1' : '0'};${ownSuper?.name ?? ''}`,
        ];

        // A target answers the whole question for itself: it is another object,
        // with its own slots, and its shape follows the same content rule.
        for (const f of data.features ?? []) {
            for (const t of f.refTargets ?? []) {
                const info = readSingletonInstanceInfo(lookup, t.id, t.name);
                parts.push(`${t.id};${info.shape};${info.label.superclassName ?? ''}`);
            }
        }
        return parts.join('|');
    });

    const { ownIsSingleton, ownSuperclassName, pillTargetSupers } = useMemo(() => {
        // Target id -> the superclass half of its label. Membership IS the
        // answer to "does this target draw as a pill": only pills are recorded.
        const pills = new Map<string, string | null>();
        let isSingleton = false;
        let superName: string | null = null;

        for (const entry of singletonSig.split('|')) {
            if (!entry) continue;
            const sep1 = entry.indexOf(';');
            const sep2 = entry.indexOf(';', sep1 + 1);
            if (sep1 < 0 || sep2 < 0) continue;
            const key = entry.slice(0, sep1);
            const mid = entry.slice(sep1 + 1, sep2);
            // The name goes last and is never split further: a class name may
            // contain a semicolon, and truncating it would print a wrong label.
            const sup = entry.slice(sep2 + 1) || null;

            if (key === 'self') { isSingleton = mid === '1'; superName = sup; continue; }
            if (mid === 'pill') pills.set(key, sup);
        }
        return { ownIsSingleton: isSingleton, ownSuperclassName: superName, pillTargetSupers: pills };
    }, [singletonSig]);

    // ── Style resolution and slot rows ───────────────────────────────

    // The cascade of the handoff — metamodel class default, then viewpoint
    // override, then per-instance override. No authoring surface writes those
    // layers yet, so the resolver folds nothing over the factory default; the
    // call site is here so the next slice adds a source, not a mechanism.
    const style = useMemo(() => resolveInstanceNodeStyle(), []);
    const chrome = useMemo(() => instanceNodeChrome(style, !!selected), [style, selected]);

    /**
     * Every row of the compartment, in model order, with its renderer already
     * decided. References come from the same `features` array as attributes and
     * keep their position: the handoff is explicit that a reference drawn as an
     * edge is duplicated graphically, never moved out of the node.
     */
    const slotRows = useMemo<SlotRow[]>(() => {
        const rows: SlotRow[] = [];

        for (const f of data.features ?? []) {
            const liveName = liveFeatureNameMap.get(f.id) ?? f.featureName;
            const isRef = f.featureKind === 'reference';
            const held = isRef
                ? (f.refTargets?.map(t => t.name) ?? [])
                : (f.values ?? (f.value != null && f.value !== '' ? [String(f.value)] : []));

            const decision = detectValueRenderer({
                value: f.value ?? '',
                values: f.values,
                isReference: isRef,
                isMany: f.isMany,
                typeName: f.typeName,
                enumLiteralNames: f.enumLiterals?.map(l => l.name),
                featureName: liveName,
            });

            rows.push({
                key: f.id,
                name: liveName,
                feature: f,
                decision,
                values: held,
                // The ACTUAL count held, which is what makes `[0]` informative.
                cardinality: f.isMany ? `[${held.length}]` : null,
                hasEdge: isRef && edgeRefNames.has(liveName),
                isEmpty: decision.kind === 'empty',
            });
        }

        // Lazy co-evolution: optional metaclass attributes with no slot yet. They
        // hold nothing, so they ARE empty slots and take the dash treatment —
        // but they stay clickable, which is the whole point of the placeholder.
        for (const attr of missingAttributes) {
            rows.push({
                key: `ph_${attr.id}`,
                name: attr.name,
                placeholder: attr,
                decision: { kind: 'empty', reason: 'the metaclass declares it; this instance has no slot yet' },
                values: [],
                cardinality: null,
                hasEdge: false,
                isEmpty: true,
            });
        }

        return rows;
    }, [data.features, liveFeatureNameMap, missingAttributes, edgeRefNames]);

    const emptyRowCount = useMemo(() => slotRows.filter(r => r.isEmpty).length, [slotRows]);

    // Slots actually holding something. NOT the `[k]` suffix (that is per-slot,
    // the values inside ONE multi-valued slot) and not the collapsed footer's
    // number (that is the complement). This is the count the shape rule reads:
    // a singleton with structure has a compartment to show, and a pill cannot
    // host one.
    const valuedSlotCount = useMemo(() => slotRows.length - emptyRowCount, [slotRows.length, emptyRowCount]);

    const instanceShape = useMemo(
        () => resolveInstanceShape({ isSingleton: ownIsSingleton, valuedSlotCount }),
        [ownIsSingleton, valuedSlotCount],
    );

    const visibleRows = useMemo(() => {
        if (style.emptyBehavior === 'dash') return slotRows;
        if (style.emptyBehavior === 'hide') return slotRows.filter(r => !r.isEmpty);
        // collapse: the hidden rows come back in place, with the dash treatment
        return emptyRowsExpanded ? slotRows : slotRows.filter(r => !r.isEmpty);
    }, [slotRows, style.emptyBehavior, emptyRowsExpanded]);

    const showCollapsedFooter = style.emptyBehavior === 'collapse'
        && emptyRowCount > 0
        && !emptyRowsExpanded;

    // ── Render ───────────────────────────────────────────────────────

    const hasFeatures = slotRows.length > 0;
    const isOrphan = !data.instanceOfClassId;
    // Neutral node: an IR viewpoint is active, it declares no view applicable to this
    // object's metaclass, and the object is not delegated to the native branch by a
    // migrated default view (irDelegated implies irResolution !== null). Same rule the
    // tree applies to a classifier the viewpoint does not render — header only, no
    // features, no entity colour. An object with no metaclass at all (isOrphan) is a
    // different defect, already signalled by mm-object--orphan, and stays out.
    const notRendered = irViewpointActive && !irResolution && !isOrphan;

    // The pill is the native branch's shape for a singleton holding nothing. An
    // orphan has no metaclass, so it cannot be one; a not-rendered node is
    // already reduced to a neutral header by the rule the tree shares, and that
    // treatment must keep winning — an object the viewpoint does not render must
    // not read like one it does.
    const isPill = instanceShape === 'pill' && !isOrphan && !notRendered;

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
                className={`mm-node mm-object ${selected ? 'selected' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass} ir-view-${irResolution.compiled.viewId}${canResize ? ' ir-resizable' : ''}${hasExplicitSize ? ' ir-sized' : ''}${isSimActiveNode ? ' sim-active' : ''}`}
                data-viewid={irResolution.compiled.viewId}
            >
                {isNodeResizable('objectNode', canResize) && (
                    <NodeResizer
                        isVisible={selected}
                        minWidth={SHAPE_MIN_SIZE}
                        minHeight={SHAPE_MIN_SIZE}
                        keepAspectRatio={keepAspectRatioForForm(shapeForm)}
                        lineClassName="node-resize-line"
                        handleClassName="node-resize-handle"
                    />
                )}
                <DynamicHandles nodeId={id} shapeForm={shapeForm} />
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

    /**
     * The value cell of one row. Each renderer is a distinct visual treatment;
     * which one applies was settled by `detectValueRenderer` when the row was
     * built, so this only paints.
     */
    const renderSlotValue = (row: SlotRow) => {
        // ── A placeholder: no slot yet, so nothing to show but the affordance ──
        if (row.placeholder) {
            const attr = row.placeholder;
            const placeholderId = `placeholder_${attr.id}`;
            const hasEnumLits = attr.enumLiterals && attr.enumLiterals.length > 0;

            if (editingFeature?.id === placeholderId) {
                return hasEnumLits ? (
                    <select
                        className="mm-object__input"
                        autoFocus
                        value={editValue}
                        onChange={(e) => {
                            setEditValue(e.target.value);
                            if (e.target.value) {
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
                        className="mm-object__input"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => commitPlaceholderEdit(attr)}
                        onKeyDown={(e) => handlePlaceholderKeyDown(e, attr)}
                    />
                );
            }

            // Empty / unset: the em dash at the lowest contrast in the node.
            // Present so the model's shape stays visible, quiet enough not to
            // compete with real data — and still the click target that turns the
            // placeholder into a real slot.
            return <span className="mm-object__dash">—</span>;
        }

        const feature = row.feature!;

        // ── Reference: a pill, and the row is never removed ──
        if (row.decision.kind === 'reference') {
            const targets = feature.refTargets ?? [];
            return (
                <>
                    {targets.map((t, i) => {
                        // A target that draws as a pill on the canvas draws as
                        // the SAME pill here, one size down: this is the level-3
                        // parity requirement of the handoff, and the component
                        // is shared precisely so the two cannot drift.
                        //
                        // A target that draws as a RECTANGLE — a singleton with
                        // structure, or an ordinary instance — keeps the cyan
                        // reference pill: a rectangle cannot be inlined in a
                        // row, and the cyan one is the navigation affordance,
                        // not a shape claim about the target.
                        if (pillTargetSupers.has(t.id)) {
                            const parts: SingletonLabelParts = {
                                superclassName: pillTargetSupers.get(t.id) ?? null,
                                instanceName: t.name,
                            };
                            return (
                                <SingletonPill
                                    key={`${t.id}_${i}`}
                                    parts={parts}
                                    variant="row"
                                    title={`Vai a ${t.name}`}
                                    onClick={(e) => { e.stopPropagation(); revealReferenceTarget(t.id); }}
                                />
                            );
                        }
                        return (
                            <span
                                key={`${t.id}_${i}`}
                                className="mm-object__ref-pill"
                                title={`Vai a ${t.name}`}
                                onClick={(e) => { e.stopPropagation(); revealReferenceTarget(t.id); }}
                            >
                                <i className="bi bi-link-45deg" />
                                {t.name}
                            </span>
                        );
                    })}
                </>
            );
        }

        // ── Empty ──
        if (row.decision.kind === 'empty') {
            return <span className="mm-object__dash">—</span>;
        }

        // ── Collection: one chip per value, the label carries the count ──
        if (row.decision.kind === 'collection') {
            const expanded = expandedChips.has(row.key);
            const shown = expanded ? row.values : row.values.slice(0, MAX_CHIPS);
            const hidden = row.values.length - shown.length;
            return (
                <>
                    {shown.map((v, i) => (
                        <span key={`${row.key}_${i}`} className="mm-object__chip">{v}</span>
                    ))}
                    {hidden > 0 && (
                        <span
                            className="mm-object__chip mm-object__chip--more"
                            title={`Mostra gli altri ${hidden}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandedChips(prev => new Set(prev).add(row.key));
                            }}
                        >
                            +{hidden}
                        </span>
                    )}
                </>
            );
        }

        // ── Scalar and colour, both editable ──
        const hasEnum = feature.enumLiterals && feature.enumLiterals.length > 0;
        const isStaleEnum = hasEnum
            && feature.value != null && feature.value !== ''
            && !feature.enumLiterals!.some(l => l.name === feature.value);

        // The swatch precedes the text and never replaces it: it annotates the value.
        const swatch = row.decision.kind === 'color' && row.decision.swatch
            ? (
                <span
                    className="mm-object__swatch"
                    style={{ ['--inode-swatch' as string]: row.decision.swatch } as React.CSSProperties}
                />
            )
            : null;

        // Enum attributes keep the popover; there is no enum renderer in the
        // handoff, so the literal reads as a scalar (or a colour, when the whole
        // literal set qualifies) and only the affordance is enum-specific.
        if (hasEnum) {
            return (
                <>
                    {swatch}
                    <span
                        className={`mm-object__scalar mm-field__enum-value${isStaleEnum ? ' mm-field__enum-stale' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setOpenEnumId(openEnumId === feature.id ? null : feature.id); }}
                        title={isStaleEnum ? `"${feature.value}" is no longer a valid enum literal` : row.decision.reason}
                    >
                        {isStaleEnum && <i className="bi bi-exclamation-triangle-fill mm-field__enum-stale-icon" />}
                        {feature.value || '(none)'}
                    </span>
                    <i className="bi bi-chevron-down mm-object__enum-chevron" />
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
                                    syncUpdateFeatureValue(id, row.name, val);
                                }
                                setOpenEnumId(null);
                            }}
                            onClose={() => setOpenEnumId(null)}
                        />
                    )}
                </>
            );
        }

        if (editingFeature?.id === feature.id) {
            return (
                <input
                    className="mm-object__input"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={commitFeatureEdit}
                    onKeyDown={handleFeatureKeyDown}
                />
            );
        }

        return (
            <>
                {swatch}
                <span className="mm-object__scalar" title={row.decision.reason}>
                    {String(feature.value)}
                </span>
            </>
        );
    };

    /** A row accepts an inline edit: attributes and placeholders, never references. */
    const isRowEditable = (row: SlotRow) =>
        !!row.placeholder || (row.feature?.featureKind === 'attribute' && !row.feature.enumLiterals?.length);

    const startRowEdit = (row: SlotRow) => {
        if (row.placeholder) {
            setEditingFeature({ id: `placeholder_${row.placeholder.id}`, featureName: row.placeholder.name });
            setEditValue('');
            return;
        }
        if (row.feature && row.feature.featureKind === 'attribute') {
            startEditFeature(row.feature.id, row.name, row.feature.value);
        }
    };

    // ── Pill: a singleton holding nothing ────────────────────────────
    //
    // `Red : Red` is redundant twice over — the instance is born with its
    // class's name (joiner/classes.ts:942), and the compartment under it is
    // empty. So the type half of the header is dropped, the compartment with
    // it, and what remains is the instance name and the abstract superclass
    // that says what KIND of thing it is: `Color : Red`, "a Red, which is a
    // Color".
    //
    // The wrapper keeps every class the rectangle carries (problem overlay,
    // highlight, simulation) and gives up only its chrome, which
    // `.mm-object--pill` strips: the pill inside is the only thing that paints.
    if (isPill) {
        return (
            <div
                className={`mm-node mm-object mm-object--pill ${selected ? 'selected' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass}${isSimActiveNode ? ' sim-active' : ''}`}
                onDoubleClick={handleDoubleClick}
                onClick={() => { if (selected && !editing) setEditing(true); }}
            >
                <DynamicHandles nodeId={id} />
                <NodeProblemIndicator nodeId={id} />

                {/* Renaming stays reachable exactly as on the rectangle: the
                    pill is a different shape for the same object, not a
                    read-only one. The input wears the pill's own geometry so
                    the node does not change size on entering the edit. */}
                {editing ? (
                    <span className="mm-object__pill mm-object__pill--node">
                        <input
                            className="mm-node__input mm-object__pill-input"
                            autoFocus
                            // Sized to the name instead of the ~20ch input
                            // default, so entering the edit does not widen the
                            // node under the pointer.
                            size={Math.max(name.length, 3)}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                        />
                    </span>
                ) : (
                    <SingletonPill
                        parts={{ superclassName: ownSuperclassName, instanceName: name }}
                        variant="node"
                        selected={!!selected}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className={`mm-node mm-object ${selected ? 'selected' : ''} ${isOrphan ? 'mm-object--orphan' : ''}${notRendered ? ' mm-object--not-rendered' : ''}${isProblemHighlighted ? ' mm-object--problem-highlighted' : ''} ${hlClass}${isSimActiveNode ? ' sim-active' : ''}`}
            data-type-display={style.typeDisplay}
            data-header-fill={style.headerFill ? 'true' : 'false'}
            style={{
                ['--inode-accent' as string]: chrome.accentColor ?? 'transparent',
                ['--inode-badge-bg' as string]: chrome.badgeBg,
                ['--inode-badge-fg' as string]: chrome.badgeFg,
            } as React.CSSProperties}
        >
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

            <NodeProblemIndicator nodeId={id} />

            {/* The left accent bar is the FIRST flex child, so it clips to the
                node radius and runs the full height of the column beside it. */}
            {chrome.accentPlacement === 'left' && (
                <div className="mm-object__accent mm-object__accent--left" />
            )}

            <div className="mm-object__column">
                {chrome.accentPlacement === 'top' && (
                    <div className="mm-object__accent mm-object__accent--top" />
                )}

                {/* Header: the instance name is underlined per the UML
                    object-diagram convention, in every configuration. How the
                    TYPE is presented is what `typeDisplay` changes. */}
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
                        <>
                            {/* A singleton that holds something stays a
                                rectangle — the compartment is the reason it
                                exists — so its singleton-ness moves to a badge:
                                the class has exactly one instance, and this is
                                it. Shown only here, never on the pill, where
                                the shape already says it. */}
                            {ownIsSingleton && (
                                <span
                                    className="mm-object__singleton-badge"
                                    title={`${metaclassName} e' singleton: questa e' la sua unica istanza`}
                                >
                                    1
                                </span>
                            )}
                            {style.typeDisplay === 'badge' && (
                                <span className="mm-object__type-badge" title={metaclassName}>
                                    {entityLetter('object')}
                                </span>
                            )}
                            <span className="mm-node__name mm-object__name" title={`${name} : ${metaclassName}`}>
                                <span className="mm-object__instance-name">{name}</span>
                                {style.typeDisplay === 'inline' && (
                                    <>
                                        <span className="mm-object__separator"> : </span>
                                        <span className="mm-object__class-name">{metaclassName}</span>
                                    </>
                                )}
                            </span>
                            {style.typeDisplay === 'chip' && (
                                <span className="mm-object__type-chip">{metaclassName}</span>
                            )}
                        </>
                    )}
                </div>

                {/* Compartment: a two-column grid, and the `=` is dropped —
                    the column boundary carries that meaning, and dropping it
                    recovers horizontal space. A node the viewpoint does not
                    render shows the header alone: showing every feature of an
                    object declared "not rendered" contradicts itself, and the
                    tree made the same call (no chevron, no features). */}
                {hasFeatures && !notRendered && visibleRows.length > 0 && (
                    <div className="mm-object__compartment">
                        {visibleRows.map((row) => {
                            const editable = isRowEditable(row);
                            return (
                                <Fragment key={row.key}>
                                    <span className="mm-object__slot-label">
                                        <span className="mm-object__feature-name">{row.name}</span>
                                        {row.cardinality && (
                                            <span className="mm-object__cardinality">{row.cardinality}</span>
                                        )}
                                    </span>
                                    <span
                                        className={`mm-object__slot-value${editable ? ' mm-object__slot-value--editable' : ''}`}
                                        onDoubleClick={editable ? () => startRowEdit(row) : undefined}
                                        onClick={editable && selected ? () => startRowEdit(row) : undefined}
                                    >
                                        {renderSlotValue(row)}
                                        {/* The marker says the target is ALSO drawn as an
                                            edge. The row is not removed for it: the edge
                                            shows the topology, the row shows that this
                                            property holds this value. */}
                                        {style.edgeMarker && row.hasEdge && (
                                            <i
                                                className="bi bi-arrow-up-right mm-object__edge-marker"
                                                title="Reso anche come edge sul canvas"
                                            />
                                        )}
                                    </span>
                                </Fragment>
                            );
                        })}
                    </div>
                )}

                {/* Collapsed slots: how many are hidden, and the click that
                    brings them back in place with the dash treatment. */}
                {hasFeatures && !notRendered && showCollapsedFooter && (
                    <button
                        type="button"
                        className="mm-object__collapsed-footer"
                        onClick={(e) => { e.stopPropagation(); setEmptyRowsExpanded(true); }}
                    >
                        <i className="bi bi-chevron-down" />
                        {emptySlotsLabel(emptyRowCount)}
                    </button>
                )}

                {/* Empty body — also the whole body of a not-rendered node */}
                {(!hasFeatures || notRendered) && (
                    <div className="mm-node__empty" />
                )}
            </div>
        </div>
    );
}

export default ObjectNode;
