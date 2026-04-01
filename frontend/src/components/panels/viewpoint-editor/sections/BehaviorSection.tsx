import React, { useCallback, useMemo } from 'react';
import { LViewElement, DViewElement } from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface BehaviorSectionProps {
    view: LViewElement;
}

const BEHAVIOR_TOGGLES: Array<{ field: string; label: string }> = [
    { field: 'draggable', label: 'Draggable' },
    { field: 'resizable', label: 'Resizable' },
    { field: 'adaptWidth', label: 'Adapt width' },
    { field: 'adaptHeight', label: 'Adapt height' },
    { field: 'storeSize', label: 'Store size' },
    { field: 'lazySizeUpdate', label: 'Lazy update' },
];

const BehaviorSection: React.FC<BehaviorSectionProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;

    const setField = useCallback((field: string, value: any) => {
        (view as any)[field] = value;
    }, [view]);

    const summary = useMemo(() => {
        const active = BEHAVIOR_TOGGLES
            .filter(t => (dview as any)[t.field])
            .map(t => t.label);
        return active.length > 0 ? active.join(' · ') : 'all off';
    }, [dview]);

    return (
        <CollapsibleSection title="Behavior" summary={summary}>
            <div className="vep-behavior-grid">
                {BEHAVIOR_TOGGLES.map(({ field, label }) => (
                    <React.Fragment key={field}>
                        <label className="vep-behavior-grid__label">{label}</label>
                        <div className="vep-behavior-grid__control">
                            <button
                                type="button"
                                className={`vep-config-grid__switch ${(dview as any)[field] ? 'vep-config-grid__switch--active' : ''}`}
                                onClick={() => setField(field, !(dview as any)[field])}
                            />
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </CollapsibleSection>
    );
};

export default BehaviorSection;
