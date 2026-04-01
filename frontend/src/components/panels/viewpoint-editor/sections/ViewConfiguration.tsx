import React, { useCallback, useMemo } from 'react';
import {
    DViewElement,
    LViewElement,
    LPointerTargetable,
    Edges,
    Fields,
    Graphs,
    Vertexes,
    GraphElements,
} from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface ViewConfigurationProps {
    view: LViewElement;
    viewpointId: string;
}

const APPLIABLE_OPTIONS = ['Any', 'Graph', 'GraphVertex', 'Vertex', 'Edge', 'EdgePoint', 'Field'] as const;

const ViewConfiguration: React.FC<ViewConfigurationProps> = ({ view, viewpointId }) => {
    const dview: DViewElement = view.__raw;

    const setField = useCallback((field: string, value: any) => {
        (view as any)[field] = value;
    }, [view]);

    // Parent view options
    const parentViewOptions = useMemo(() => {
        try {
            const possibleParents = (view as any).allPossibleParentViews || [];
            return possibleParents
                .filter((v: any) => v.viewpoint?.id === viewpointId)
                .map((v: any) => ({ id: v.id, name: v.name || 'Unnamed' }));
        } catch { return []; }
    }, [view, viewpointId]);

    // Build summary when collapsed
    const summary = useMemo(() => {
        const parts: string[] = [];
        if (dview.isExclusiveView) parts.push('Exclusive');
        if (dview.forceNodeType) parts.push(dview.forceNodeType);
        if (dview.appliableTo && dview.appliableTo !== 'Any') parts.push(dview.appliableTo);
        if (dview.father) parts.push('has parent');
        return parts.join(', ') || 'defaults';
    }, [dview.isExclusiveView, dview.forceNodeType, dview.appliableTo, dview.father]);

    return (
        <CollapsibleSection title="Configuration" summary={summary} defaultExpanded={true}>
            <div className="vep-config-grid">
                {/* Exclusive toggle */}
                <label className="vep-config-grid__label">Exclusive</label>
                <div className="vep-config-grid__control">
                    <button
                        type="button"
                        className={`vep-config-grid__switch ${dview.isExclusiveView ? 'vep-config-grid__switch--active' : ''}`}
                        onClick={() => setField('isExclusiveView', !dview.isExclusiveView)}
                    />
                </div>

                {/* Appearance dropdown */}
                <label className="vep-config-grid__label">Appearance</label>
                <select
                    className="vep-config-grid__select"
                    value={dview.forceNodeType || 'unset'}
                    onChange={(e) => setField('forceNodeType', e.target.value === 'unset' ? undefined : e.target.value)}
                >
                    <option value="unset">Automatic</option>
                    <optgroup label="Graph">
                        {Object.keys(Graphs).map(k => (
                            <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Edge">
                        {Object.keys(Edges).map(k => (
                            <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Field">
                        {Object.keys(Fields).map(k => (
                            <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                    <optgroup label="Vertex">
                        {Object.keys(Vertexes).map(k => (
                            <option key={k} value={k}>{(GraphElements as any)[k]?.cname || k}</option>
                        ))}
                    </optgroup>
                </select>

                {/* Appliable to dropdown */}
                <label className="vep-config-grid__label">Appliable to</label>
                <select
                    className="vep-config-grid__select"
                    value={dview.appliableTo || 'Any'}
                    onChange={(e) => setField('appliableTo', e.target.value)}
                >
                    {APPLIABLE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>

                {/* Parent view dropdown */}
                <label className="vep-config-grid__label">Parent view</label>
                <select
                    className="vep-config-grid__select"
                    value={dview.father || ''}
                    onChange={(e) => setField('father', e.target.value || undefined)}
                >
                    <option value="">None</option>
                    {parentViewOptions.map((pv: { id: string; name: string }) => (
                        <option key={pv.id} value={pv.id}>{pv.name}</option>
                    ))}
                </select>
            </div>
        </CollapsibleSection>
    );
};

export default ViewConfiguration;
