/*
 * NodeEditor.tsx - Redesigned Node Tab
 *
 * Displays and edits properties of selected graph elements (Vertex, Edge, Graph).
 * Features:
 * - Collapsible sections for progressive disclosure
 * - Restored Relationships section (Super element, Incoming Edges)
 * - Improved Anchors visualization with drag support
 * - Consistent with Jjodel design system
 */

import React, { Dispatch, ReactElement, ReactNode, useRef, useState, useEffect } from 'react';
import ReactJson from 'react-json-view' // npm i react-json-view --force
import { connect } from 'react-redux';
import { DState } from '../../redux/store';
import type {
    LModelElement,
    LViewElement,
    LGraphElement,
    LVoidVertex,
    LVoidEdge,
    LGraph,
    DGraphElement,
    DNamedElement,
    IPoint,
    GraphPoint,
    GObject,
    DGraph,
    Info,
    Size,
    GObject,
    DVertex,
    DGraph,
    Pointer} from '../../joiner'
import {Draggable, U,
    Select,
    U,
    L,
    Select,
    Input,
    GenericInput,
    SetRootFieldAction,
} from '../../joiner';
import './editors.scss';
import './node-editor.scss';
import { Empty } from "./Empty";
import { SizeInput } from "../forEndUser/SizeInput";
import './node-editor-redesign.scss';
import { CommandBar, Btn } from '../commandbar/CommandBar';
import {SizeInput} from "../forEndUser/SizeInput";
import {Tooltip} from "../forEndUser/Tooltip";

// ============================================
// TYPES
// ============================================

interface OwnProps {}

interface StateProps {
    selected?: {
        node: LGraphElement;
        view: LViewElement;
        modelElement?: LModelElement;
    };
}

interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================

interface SectionProps {
    title: string;
    icon: string;
    defaultOpen?: boolean;
    badge?: string | number;
    children: ReactNode;
}

const Section: React.FC<SectionProps> = ({
    title,
    icon,
    defaultOpen = true,
    badge,
    children
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`node-section ${isOpen ? 'node-section--open' : ''}`}>
            <button
                className="node-section__header"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <div className="node-section__title">
                    <i className={`bi bi-chevron-${isOpen ? 'down' : 'right'}`} />
                    <i className={`bi bi-${icon}`} />
                    <span>{title}</span>
                </div>
                {badge !== undefined && (
                    <span className="node-section__badge">{badge}</span>
                )}
            </button>
            {isOpen && (
                <div className="node-section__content">
                    {children}
                </div>
            )}
        </div>
    );
};

// ============================================
// ANCHOR INPUT HELPER
// ============================================

function anchorinput(
    k: string,
    a: Partial<IPoint>,
    node: LGraphElement,
    anchors: DGraphElement['anchors'],
    anchorEntries: [string, GraphPoint][],
    setAnchor: (v: string) => void,
    stateanchor: string
) {
    return (
        <div key={k || 'updating'} className="anchor-input-row">
            <div className="anchor-input-row__field anchor-input-row__field--name">
                <span className="anchor-input-row__label">name</span>
                <Input
                    getter={() => k}
                    setter={(newname) => {
                        let tmp = { ...anchors };
                        tmp[newname as string] = tmp[k];
                        delete tmp[k];
                        node.anchors = tmp;
                        if (stateanchor !== '__jjAll') setAnchor(newname as string);
                    }}
                    placeholder={'anchor name'}
                />
            </div>
            <div className="anchor-input-row__field">
                <span className="anchor-input-row__label">x</span>
                <input
                    type="number"
                    value={(a.x ?? 0.5).toFixed(3)}
                    onChange={(e) => {
                        let tmp = { ...anchors };
                        tmp[k] = { ...(tmp[k] || { x: 0.5, y: 0.5 }) } as any;
                        tmp[k].x = +e.target.value || 0;
                        node.anchors = tmp;
                    }}
                    step={0.01}
                    min={0}
                    max={1}
                />
            </div>
            <div className="anchor-input-row__field">
                <span className="anchor-input-row__label">y</span>
                <input
                    type="number"
                    value={(a.y ?? 0.5).toFixed(3)}
                    onChange={(e) => {
                        let tmp = { ...anchors };
                        tmp[k] = { ...(tmp[k] || { x: 0.5, y: 0.5 }) } as any;
                        tmp[k].y = +e.target.value || 0;
                        node.anchors = tmp;
                    }}
                    step={0.01}
                    min={0}
                    max={1}
                />
            </div>
            <button
                className="anchor-input-row__delete"
                onClick={() => {
                    if (!anchors[k]) return;
                    let i = anchorEntries.findIndex((e) => e[0] === k);
                    let tmp = { ...anchors };
                    delete tmp[k];
                    node.anchors = tmp;
                    if (stateanchor !== '__jjAll')
                        setAnchor(anchorEntries[Math.min(i + 1, anchorEntries.length - 1)][0]);
                }}
                title="Delete anchor"
            >
                <i className="bi bi-trash" />
            </button>
        </div>
    );
}

// ============================================
// ANCHOR VISUALIZATION COMPONENT
// ============================================

interface AnchorVisualizationProps {
    anchors: Record<string, GraphPoint>;
    selectedAnchor: string | null;
    onSelect: (name: string) => void;
    node: LGraphElement;
}

const AnchorVisualization: React.FC<AnchorVisualizationProps> = ({
    anchors,
    selectedAnchor,
    onSelect,
    node
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);

    const anchorEntries = Object.entries(anchors);

    // Handle mouse down - start dragging
    const handleMouseDown = (e: React.MouseEvent, anchorName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(anchorName);
        onSelect(anchorName);
    };

    // Handle mouse move - update anchor position
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !dragging) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

            const tmp = { ...anchors };
            tmp[dragging] = { x, y } as GraphPoint;
            node.anchors = tmp;
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, anchors, node]);

    if (anchorEntries.length === 0) {
        return (
            <div className="anchor-viz__empty">
                <i className="bi bi-bullseye" />
                <span>No anchors defined</span>
            </div>
        );
    }

    return (
        <div className="anchor-viz">
            <div
                className={`anchor-viz__node ${dragging ? 'anchor-viz__node--dragging' : ''}`}
                ref={containerRef}
            >
                <div className="anchor-viz__node-body">
                    <div className="anchor-viz__center" />
                </div>
                {anchorEntries.map(([name, point]) => (
                    <button
                        key={name}
                        className={`anchor-viz__point ${selectedAnchor === name ? 'anchor-viz__point--selected' : ''} ${dragging === name ? 'anchor-viz__point--dragging' : ''}`}
                        style={{
                            left: `${point.x * 100}%`,
                            top: `${point.y * 100}%`
                        }}
                        onMouseDown={(e) => handleMouseDown(e, name)}
                        onClick={() => onSelect(name)}
                        title={`${name} (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}
                        tabIndex={0}
                    >
                        <span className="anchor-viz__point-label">{name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

function NodeEditorComponent(props: AllProps) {
    const anchors = props.selected?.node?.anchors || {};
    const anchorEntries = Object.entries(anchors);
    const [anchor, setAnchor] = useState(anchorEntries?.[0]?.[0] || '0');

    const selected = props.selected;
    const editable = true;

    if (!selected?.node) {
        return (
            <Empty
                icon="bi-bounding-box-fill"
                title="No node selected"
                description="Select an element on the canvas to view its node properties."
            />
        );
    }

    const node = selected.node;
    const dnode = (node.__raw || node) as DGraphElement;
    const cname = dnode.className;

    // Determine element type
    const isGraph = ['DGraph', 'DGraphVertex'].includes(cname);
    const isVertex = ['DVoidVertex', 'DVertex', 'DEdgePoint', 'DGraphVertex'].includes(cname);
    const isEdge = ['DVoidEdge', 'DEdge'].includes(cname);
    const isField = !isGraph && !isVertex && !isEdge;
    const isGraphVertex = isVertex && isGraph;

    const asGraph: LGraph | undefined = isGraph ? (node as any) : undefined;
    const asVertex: LVoidVertex | undefined = isVertex ? (node as any) : undefined;
    const asEdge: LVoidEdge | undefined = isEdge ? (node as any) : undefined;

    // Helper functions
    function openNode(id: Pointer<DGraphElement>) {
        SetRootFieldAction.new('_lastSelected.node', id, '', false);
    }

    function getNodeLabel(node: LGraphElement) {
        if (!node) return 'error';
        const model: DNamedElement | undefined = node.model?.__raw as any;
        if (!model) return node.className;
        return node.className + ' - ' + (model.name || model.className)
    }

    function getEdgeLabel(edge: LVoidEdge) {
        const s: DNamedElement | undefined = edge?.start?.model?.__raw as any;
        const e: DNamedElement | undefined = edge?.end?.model?.__raw as any;
        return {
            start: s ? s.name || s.className : 'empty',
            end: e ? e.name || e.className : 'empty'
        };
    }

    // Get element type info
    const getElementType = () => {
        if (isGraphVertex) return { label: 'GraphVertex', icon: 'diagram-3' };
        if (isGraph) return { label: 'Graph', icon: 'grid-3x3' };
        if (isEdge) return { label: 'Edge', icon: 'arrow-right' };
        if (isVertex) return { label: 'Vertex', icon: 'bounding-box' };
        return { label: 'Field', icon: 'input-cursor' };
    };

    const elementType = getElementType();

    // Edge endpoints
    const edgeStart: LGraphElement | undefined = asEdge?.start;
    const edgeEnd: LGraphElement | undefined = asEdge?.end;

    // Relationships
    const edgesIn = !isEdge ? node.edgesIn || [] : [];
    const edgesOut = !isEdge ? node.edgesOut || [] : [];
    const hasFather = !!node.father?.className;
    const hasRelationships = hasFather || edgesIn.length > 0 || (isEdge && (edgeStart || edgeEnd));

    return (
        <div className="node-editor-redesign">
            {/* Header - matches Properties/Viewpoints style */}
            <div className="node-header">
                <div className="node-header__icon">
                    <i className="bi bi-bounding-box-circles" />
                </div>
                <h1 className="node-header__title">Node</h1>
            </div>

            {/* Section: Transform */}
            <Section title="TRANSFORM" icon="arrows-move" defaultOpen={true}>
                <div className="node-editor__grid">
                    {/* Position */}
                    {asVertex && !isGraphVertex && (
                        <>
                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Position</span>
                                <div className="node-editor__field-inputs">
                                    <label className="node-editor__input-group">
                                        <span className="node-editor__input-prefix">x</span>
                                        <Input
                                            data={asVertex}
                                            field="x"
                                            type="number"
                                            readOnly={!editable}
                                        />
                                    </label>
                                    <label className="node-editor__input-group">
                                        <span className="node-editor__input-prefix">y</span>
                                        <Input
                                            data={asVertex}
                                            field="y"
                                            type="number"
                                            readOnly={!editable}
                                        />
                                    </label>
                                </div>
                            </label>

                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Size</span>
                                <div className="node-editor__field-inputs">
                                    <label className="node-editor__input-group">
                                        <span className="node-editor__input-prefix">w</span>
                                        <Input
                                            data={asVertex}
                                            field="width"
                                            type="number"
                                            readOnly={!editable}
                                        />
                                    </label>
                                    <label className="node-editor__input-group">
                                        <span className="node-editor__input-prefix">h</span>
                                        <Input
                                            data={asVertex}
                                            field="height"
                                            type="number"
                                            readOnly={!editable}
                                        />
                                    </label>
                                </div>
                            </label>
                        </>
                    )}

                    {/* Graph-specific: Offset, Size, Grid */}
                    {asGraph && (
                        <>
                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Offset</span>
                                <div className="node-editor__field-inputs">
                                    <GenericInput data={asGraph} field="offset" />
                                </div>
                            </label>

                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Size</span>
                                <div className="node-editor__field-inputs">
                                    <SizeInput
                                        data={asGraph}
                                        field="size"
                                        xsetter={(x) => (asGraph.x = +x)}
                                        ysetter={(y) => (asGraph.y = +y)}
                                        wsetter={(w) => (asGraph.w = +w)}
                                        hsetter={(h) => (asGraph.h = +h)}
                                    />
                                </div>
                            </label>
                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Grid</span>
                                {(dnode as DGraph).grid ?
                                    <Tooltip tooltip={'Erases node\'s grid to inherit it from the view instead.'}><i
                                        className={'bi bi-trash my-auto ms-1'} style={{color: 'red'}} onClick={() => {
                                        asGraph.grid = null as any;
                                    }}/></Tooltip> :
                                    <span className={'my-auto'} style={{color: 'orange'}}>&nbsp;(inherited from view)</span>}
                                <div className="node-editor__field-inputs">
                                    <SizeInput data={asGraph}
                                               xlabel={grid!.type === 'polar' ? 'modulo' : 'x'}
                                               ylabel={grid!.type === 'polar' ? 'angle' : 'y'}
                                               xgetter={(l) => '' + ((l as LGraph).grid.x || 0)}
                                               xsetter={(val, l) => l.grid = {x: +val || 0} as any}
                                               ygetter={(l) => '' + ((l as LGraph).grid.y || 0)}
                                               ysetter={(val, l) => l.grid = {y: +val || 0} as any}
                                    />
                                </div>
                            </label>
                            {/*
            <label className={'input-container'}>
                <b className={'me-2  my-auto'}>Grid coordinates:</b>
                <Tooltip tooltip={Info.grid.txt}><Select data={asGraph}
                                                         getter={l => l.grid?.type || "cartesian"}
                                                         setter={(v, l) => {
                                                             l.grid = {type: v};
                                                         }}>
                    <optgroup label={"Coordinate type"}></optgroup>
                    <option value="cartesian">Cartesian</option>
                    <option value="polar">Polar</option>
                </Select>
                </Tooltip>
            </label>
            */}
                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Grid snaps to</span>
                                <div className="node-editor__field-inputs">
                                    <Select data={asGraph} getter={(l) => l.grid?.center || "cc"}
                                            id='grid'
                                            setter={( //@ts-ignore
                                                (val, l, b, c, d, e) => {
                                                    console.log('select setter grid', {val, l, b, c, d, e})
                                                    l.grid = {center: val} as any
                                                    return 'useless';
                                                }) as any}>
                                        <optgroup label={"Coordinate type"}>
                                            <option value={'cc'}>center</option>
                                            <option value={'tt'}>top</option>
                                            <option value={'ll'}>left</option>
                                            <option value={'bb'}>bottom</option>
                                            <option value={'rr'}>right</option>
                                            <option value={'tl'}>top left</option>
                                            <option value={'tr'}>top right</option>
                                            <option value={'bl'}>bottom left</option>
                                            <option value={'br'}>bottom right</option>
                                        </optgroup>
                                    </Select>
                                </div>
                            </label>
                            <label className="node-editor__field-row">
                                <span className="node-editor__field-label">Grid visible</span>
                                <div className="node-editor__field-inputs">
                                    <Input type={'checkbox'}
                                           data={asGraph}
                                           getter={(l) => l.grid?.visible}
                                           setter={((val: boolean, l: LGraph) => l.grid = {visible: !!val} as any) as any}
                                    />
                                </div>
                            </label>
                            {/*<label className="node-editor__field-row">
                                <span className="node-editor__field-label">####LABEL####</span>
                                <div className="node-editor__field-inputs">
                                    <SizeInput ####example#### />
                                </div>
                            </label>*/}
                        </>
                    )}

                    {/* Zoom */}
                    <label className="node-editor__field-row">
                        <span className="node-editor__field-label">Zoom</span>
                        <div className="node-editor__field-inputs">
                            <GenericInput data={node} field="zoom" />
                        </div>
                    </label>

                    {/* Stacking order & isResized */}
                    <label className="node-editor__field-row node-editor__field-row--inline">
                        {(!isGraph || isGraphVertex) && (
                            <label className="node-editor__inline-field">
                                <span className="node-editor__field-label">Stacking order</span>
                                <Input
                                    data={node}
                                    field="zIndex"
                                    type="number"
                                    readOnly={!editable}
                                />
                            </label>
                        )}

                        {asVertex && (
                            <label className="node-editor__inline-field node-editor__inline-field--checkbox">
                                <Input
                                    data={asVertex}
                                    field="isResized"
                                    type="checkbox"
                                    readOnly={!editable}
                                />
                                <span className="node-editor__field-label">Resized</span>
                            </label>
                        )}
                    </label>
                </div>
            </Section>

            {/* Section: Relationships */}
            {hasRelationships && (
                <Section title="RELATIONSHIPS" icon="diagram-2" defaultOpen={true}>
                    {/* Super element */}
                    {hasFather && (
                        <div className="node-editor__relationship">
                            <span className="node-editor__relationship-label">Super element</span>
                            <button
                                className="node-editor__relationship-link"
                                onClick={() => dnode.father && openNode(dnode.father)}
                            >
                                <span>{node.father?.className || 'Parent'}</span>
                                <i className="bi bi-arrow-up-right" />
                            </button>
                        </div>
                    )}

                    {/* Edge start/end (for edges) */}
                    {isEdge && edgeStart && (
                        <div className="node-editor__relationship">
                            <span className="node-editor__relationship-label">Edge start</span>
                            <button
                                className="node-editor__relationship-link"
                                onClick={() => openNode(edgeStart.id)}
                            >
                                <span>{getNodeLabel(edgeStart)}</span>
                                <i className="bi bi-arrow-right" />
                            </button>
                        </div>
                    )}

                    {isEdge && edgeEnd && (
                        <div className="node-editor__relationship">
                            <span className="node-editor__relationship-label">Edge end</span>
                            <button
                                className="node-editor__relationship-link"
                                onClick={() => openNode(edgeEnd.id)}
                            >
                                <span>{getNodeLabel(edgeEnd)}</span>
                                <i className="bi bi-arrow-left" />
                            </button>
                        </div>
                    )}

                    {/* Incoming edges (for vertices) */}
                    {edgesIn.length > 0 && (
                        <div className="node-editor__edges">
                            <span className="node-editor__edges-label">Incoming Edges</span>
                            <div className="node-editor__edges-list">
                                {edgesIn.slice(0, 10).map((edge: LVoidEdge, i: number) => {
                                    const labels = getEdgeLabel(edge);
                                    return (
                                        <div
                                            key={edge.id || i}
                                            className="node-editor__edge"
                                            onClick={() => openNode(edge.id)}
                                        >
                                            <span className="node-editor__edge-source">{labels.start}</span>
                                            <i className="bi bi-arrow-right" />
                                            <span className="node-editor__edge-target">{labels.end}</span>
                                        </div>
                                    );
                                })}
                                {edgesIn.length > 10 && (
                                    <div className="node-editor__edges-more">
                                        +{edgesIn.length - 10} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Section>
            )}

            {/* Section: Edge Anchors (for edges) */}
            {isEdge && asEdge && (
                <Section title="EDGE ANCHORS" icon="pin-angle" defaultOpen={false}>
                    <div className="node-editor__edge-anchors">
                        <label className="node-editor__field-row">
                            <span className="node-editor__field-label">Start anchor</span>
                            <label className="node-editor__field-inputs">
                                {asEdge.anchorStart && typeof asEdge.anchorStart === 'object' ? (
                                    <SizeInput data={asEdge} field="anchorStart" />
                                ) : (
                                    <GenericInput data={asEdge} field="anchorStart" />
                                )}
                                <button
                                    className="node-editor__btn-icon"
                                    onClick={() => (asEdge.anchorStart = undefined as any)}
                                    title="Clear anchor"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            </label>
                        </label>

                        <label className="node-editor__field-row">
                            <span className="node-editor__field-label">End anchor</span>
                            <div className="node-editor__field-inputs">
                                {asEdge.anchorEnd && typeof asEdge.anchorEnd === 'object' ? (
                                    <SizeInput data={asEdge} field="anchorEnd" />
                                ) : (
                                    <GenericInput data={asEdge} field="anchorEnd" />
                                )}
                                <button
                                    className="node-editor__btn-icon"
                                    onClick={() => (asEdge.anchorEnd = undefined as any)}
                                    title="Clear anchor"
                                >
                                    <i className="bi bi-x-lg" />
                                </button>
                            </div>
                        </label>
                    </div>
                </Section>
            )}

            {/* Section: Anchors (for vertices) */}
            {(isVertex || isGraph) && (
                <Section
                    title="ANCHORS"
                    icon="bullseye"
                    defaultOpen={true}
                    badge={anchorEntries.length > 0 ? `${anchorEntries.length} points` : undefined}
                >
                    {/* Anchor Visualization */}
                    <AnchorVisualization
                        anchors={anchors}
                        selectedAnchor={anchor}
                        onSelect={setAnchor}
                        node={node}
                    />

                    {/* Anchor Editor */}
                    {anchorEntries.length > 0 && (
                        <div className="node-editor__anchor-editor">
                            <label className="node-editor__anchor-selector">
                                <label>Edit anchor</label>
                                <select
                                    value={anchor}
                                    onChange={(e) => setAnchor(e.target.value)}
                                >
                                    <option value="__jjAll">All</option>
                                    <optgroup label="anchors">
                                        {anchorEntries.map(([name]) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                <button
                                    className="node-editor__btn-icon"
                                    onClick={() => {
                                        const name = U.increaseEndingNumber(
                                            'anchor1',
                                            false,
                                            false,
                                            (s) => s in anchors
                                        );
                                        node.anchors = {
                                            ...anchors,
                                            [name]: { x: 0.5, y: 0.5 } as any
                                        };
                                        setAnchor(name);
                                    }}
                                    title="Add new anchor"
                                >
                                    <i className="bi bi-plus-lg" />
                                </button>
                            </label>

                            {/* Anchor input fields */}
                            <div className="node-editor__anchor-fields">
                                {anchor === '__jjAll'
                                    ? anchorEntries.map(([k, a]) =>
                                          anchorinput(k, a, node, anchors, anchorEntries, setAnchor, anchor)
                                      )
                                    : anchorinput(
                                          anchor,
                                          anchors[anchor] || { x: 0.5, y: 0.5 },
                                          node,
                                          anchors,
                                          anchorEntries,
                                          setAnchor,
                                          anchor
                                      )}
                            </div>
                        </div>
                    )}

                    {/* No anchors - add button */}
                    {anchorEntries.length === 0 && (
                        <div className="node-editor__anchor-empty">
                            <button
                                className="node-editor__btn-add"
                                onClick={() => {
                                    node.anchors = {
                                        ...anchors,
                                        '0': { x: 0.5, y: 0.5 } as any
                                    };
                                    setAnchor('0');
                                }}
                            >
                                <i className="bi bi-plus-lg" />
                                <span>Add first anchor</span>
                            </button>
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}

// ============================================
// REDUX CONNECTION
// ============================================

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {};
    const selected = state._lastSelected;

    if (selected) {
        const modelElement = state._lastSelected?.modelElement;
        const node = state._lastSelected?.node;
        const view = state._lastSelected?.view;

        if (node && view) {
            ret.selected = {
                node: L.fromPointer(node),
                view: L.fromPointer(view),
                modelElement: modelElement ? L.fromPointer(modelElement) : undefined
            };
        }
    }

    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const NodeEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(NodeEditorComponent);

export const NodeEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <NodeEditorConnected {...{...props, children}} />;
};

export default NodeEditor;