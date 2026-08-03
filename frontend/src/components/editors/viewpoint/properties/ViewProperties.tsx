import React, { useMemo, useCallback, JSX } from 'react';
import { useSelector } from 'react-redux';
import {
    DViewElement,
    LViewElement,
    LPointerTargetable,
    GenericInput,
    GObject,
    Info,
    Pointer,
    Edges,
    Fields,
    Graphs,
    Vertexes,
    GraphElements,
} from '../../../../joiner';

interface ViewPropertiesProps {
    viewId: string;
    viewpointId: string;
    isExpertMode: boolean;
    readOnly: boolean;
}

const defaultEvents = [
    'onDataUpdate',
    'onDragStart',
    'whileDragging',
    'onDragEnd',
    'onResizeStart',
    'whileResizing',
    'onResizeEnd',
] as const;

const ViewProperties: React.FC<ViewPropertiesProps> = ({ viewId, viewpointId, isExpertMode, readOnly }) => {
    // Subscribe to Redux for reactivity (triggers re-render on view data changes)
    const _reduxTrigger = useSelector((state: any) => state[viewId]);

    // Resolve view via LPointerTargetable — same pattern as WorkbenchEditors
    const lview = useMemo(() => {
        try {
            const resolved = LPointerTargetable.fromPointer(viewId as Pointer);
            if (resolved && (resolved as any).className) {
                return resolved as LViewElement;
            }
        } catch { /* view not found */ }
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewId, _reduxTrigger]);

    const dview: DViewElement | undefined = lview?.__raw;

    const setField = useCallback((field: string, value: any) => {
        if (!readOnly && lview) {
            (lview as any)[field] = value;
        }
    }, [lview, readOnly]);

    if (!lview || !dview) {
        return (
            <div className="workbench-properties__empty">
                <span>View not found</span>
            </div>
        );
    }

    // Get parent view options
    let parentViewOptions: { id: string; name: string }[] = [];
    try {
        const possibleParents = lview.allPossibleParentViews || [];
        parentViewOptions = possibleParents
            .filter((v: any) => v.viewpoint?.id === viewpointId)
            .map((v: any) => ({ id: v.id, name: v.name || 'Unnamed' }));
    } catch { /* ignore */ }

    return (
        <div className="workbench-properties">
            {/* ===== GENERAL ===== */}
            <h4 className="workbench-properties__section-header">General</h4>

            <div className="wp-field">
                <label className="wp-field__label">Name</label>
                <input
                    className="wp-field__input"
                    value={dview.name || ''}
                    onChange={(e) => setField('name', e.target.value)}
                    disabled={readOnly}
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">
                    Priority
                    {dview.explicitApplicationPriority === undefined && (
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}> (auto)</span>
                    )}
                </label>
                <input
                    className="wp-field__input"
                    type="number"
                    value={dview.explicitApplicationPriority ?? ''}
                    placeholder={`automatic: ${lview.explicitApplicationPriority ?? ''}`}
                    onChange={(e) => {
                        const val = e.target.value;
                        setField('explicitApplicationPriority', val ? +val : undefined);
                    }}
                    disabled={readOnly}
                />
            </div>

            <div className="wp-toggle">
                <span className="wp-toggle__label">Exclusive</span>
                <button
                    type="button"
                    className={`wp-switch ${dview.isExclusiveView ? 'wp-switch--active' : ''}`}
                    onClick={() => setField('isExclusiveView', !dview.isExclusiveView)}
                    disabled={readOnly}
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Parent view</label>
                <select
                    className="wp-field__select"
                    value={dview.father || ''}
                    onChange={(e) => setField('father', e.target.value || undefined)}
                    disabled={readOnly}
                >
                    <option value="">None</option>
                    {parentViewOptions.map(pv => (
                        <option key={pv.id} value={pv.id}>{pv.name}</option>
                    ))}
                </select>
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Preferred appearance</label>
                <select
                    className="wp-field__select"
                    value={dview.forceNodeType || 'unset'}
                    onChange={(e) => {
                        const val = e.target.value;
                        setField('forceNodeType', val === 'unset' ? undefined : val);
                    }}
                    disabled={readOnly}
                >
                    <option value="unset">Automatic</option>
                    <optgroup label="Graph">
                        {Object.keys(Graphs).map(k => (
                            <option key={k} value={k}>{GraphElements[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Edge">
                        {Object.keys(Edges).map(k => (
                            <option key={k} value={k}>{GraphElements[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Field">
                        {Object.keys(Fields).map(k => (
                            <option key={k} value={k}>{GraphElements[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Vertex">
                        {Object.keys(Vertexes).map(k => (
                            <option key={k} value={k}>{GraphElements[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                </select>
            </div>

            {/* ===== BEHAVIOR ===== */}
            <hr className="wp-divider" />
            <h4 className="workbench-properties__section-header">Behavior</h4>

            <BehaviorToggle label="Draggable" checked={!!dview.draggable} onChange={(v) => setField('draggable', v)} disabled={readOnly} />
            <BehaviorToggle label="Resizable" checked={!!dview.resizable} onChange={(v) => setField('resizable', v)} disabled={readOnly} />
            <BehaviorToggle label="Adapt width" checked={!!dview.adaptWidth} onChange={(v) => setField('adaptWidth', v)} disabled={readOnly} />
            <BehaviorToggle label="Adapt height" checked={!!dview.adaptHeight} onChange={(v) => setField('adaptHeight', v)} disabled={readOnly} />
            <BehaviorToggle label="Store size" checked={!!dview.storeSize} onChange={(v) => setField('storeSize', v)} disabled={readOnly} />
            <BehaviorToggle label="Lazy update" checked={!!dview.lazySizeUpdate} onChange={(v) => setField('lazySizeUpdate', v)} disabled={readOnly} />

            {/* ===== ADVANCED RENDERING (Expert only) ===== */}
            {isExpertMode && (
                <AdvancedRenderingSection viewId={viewId} dview={dview} readOnly={readOnly} />
            )}

            {/* ===== EVENTS (Expert only) ===== */}
            {isExpertMode && (
                <EventsSection dview={dview} />
            )}
        </div>
    );
};

// ---------- BehaviorToggle ----------
interface BehaviorToggleProps {
    label: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled: boolean;
}

const BehaviorToggle: React.FC<BehaviorToggleProps> = ({ label, checked, onChange, disabled }) => (
    <div className="wp-toggle">
        <span className="wp-toggle__label">{label}</span>
        <button
            type="button"
            className={`wp-switch ${checked ? 'wp-switch--active' : ''}`}
            onClick={() => onChange(!checked)}
            disabled={disabled}
        />
    </div>
);

// ---------- AdvancedRenderingSection ----------
interface AdvancedRenderingSectionProps {
    viewId: string;
    dview: DViewElement;
    readOnly: boolean;
}

const AdvancedRenderingSection: React.FC<AdvancedRenderingSectionProps> = ({ viewId, dview, readOnly }) => {
    // Use reflection to get Edge and EdgePoint properties, same as EdgeData/EdgePointData
    const lview = useMemo(() => {
        try { return LPointerTargetable.fromPointer(viewId as Pointer) as LViewElement; }
        catch { return null; }
    }, [viewId]);

    const { edgeRows, edgePointRows } = useMemo(() => {
        const eRows: JSX.Element[] = [];
        const epRows: JSX.Element[] = [];
        if (!lview) return { edgeRows: eRows, edgePointRows: epRows };

        const singleton: GObject & LViewElement = LViewElement.singleton as any;
        const prefixLength = '__info_of__'.length;

        for (const fullKey in singleton) {
            if (fullKey.indexOf('__info_of__') !== 0) continue;
            const info: Info = singleton[fullKey];
            const key = fullKey.substring(prefixLength);
            if (info.hidden || info.obsolete || info.todo) continue;

            if (info.isEdge) {
                eRows.push(
                    <div className="input-container" key={key}>
                        <GenericInput
                            rootClassName="edge-input-row"
                            className="d-flex"
                            data={lview}
                            field={key as any}
                            tooltip={true}
                            info={info}
                            disabled={readOnly}
                        />
                    </div>
                );
            }
            if (info.isEdgePoint) {
                epRows.push(
                    <div className="input-container" key={key}>
                        <GenericInput
                            rootClassName="edgepoint-input-row"
                            className="d-flex"
                            data={lview}
                            field={key as any}
                            tooltip={true}
                            info={info}
                            disabled={readOnly}
                        />
                    </div>
                );
            }
        }
        return { edgeRows: eRows, edgePointRows: epRows };
    }, [lview, readOnly]);

    return (
        <details className="wp-collapsible">
            <summary>Advanced rendering</summary>
            <div className="wp-collapsible__content">
                {edgeRows.length > 0 && (
                    <>
                        <div className="wp-collapsible__sub-header">Edge</div>
                        {edgeRows}
                    </>
                )}
                {edgePointRows.length > 0 && (
                    <>
                        <div className="wp-collapsible__sub-header">Edge Point</div>
                        {edgePointRows}
                    </>
                )}

                <div className="wp-collapsible__sub-header">Applicable to</div>
                <div className="wp-field">
                    <select
                        className="wp-field__select"
                        value={dview.appliableTo || 'Any'}
                        onChange={(e) => {
                            if (!readOnly && lview) {
                                (lview as any).appliableTo = e.target.value;
                            }
                        }}
                        disabled={readOnly}
                    >
                        <option value="Any">Any</option>
                        <option value="Graph">Graph</option>
                        <option value="GraphVertex">GraphVertex</option>
                        <option value="Vertex">Vertex</option>
                        <option value="Edge">Edge</option>
                        <option value="EdgePoint">EdgePoint</option>
                        <option value="Field">Field</option>
                    </select>
                </div>
            </div>
        </details>
    );
};

// ---------- EventsSection ----------
interface EventsSectionProps {
    dview: DViewElement;
}

const EventsSection: React.FC<EventsSectionProps> = ({ dview }) => {
    const customEventKeys = Object.keys(dview.events || {}).filter(k => (dview.events as any)?.[k]);

    return (
        <details className="wp-collapsible">
            <summary>Events</summary>
            <div className="wp-collapsible__content">
                <div className="wp-collapsible__sub-header">Default events</div>
                {/*
                 * No status dot: event handlers are saved with the view but the current
                 * editor never runs them, so neither state of the indicator would be true
                 * (--active claims they run, the base state claims none is defined).
                 * The names stay: knowing which slots exist is still useful information.
                 */}
                {defaultEvents.map(name => (
                    <div className="wp-event-item" key={name}>
                        <span className="wp-event-item__name">{name}</span>
                    </div>
                ))}

                {customEventKeys.length > 0 && (
                    <>
                        <div className="wp-collapsible__sub-header" style={{ marginTop: 8 }}>Custom events</div>
                        {customEventKeys.map(name => (
                            <div className="wp-event-item" key={name}>
                                <span className="wp-event-item__name">{name}</span>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </details>
    );
};

export default ViewProperties;
