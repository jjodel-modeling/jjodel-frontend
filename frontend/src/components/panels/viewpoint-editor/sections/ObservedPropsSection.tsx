import React, { useState, useCallback, useMemo } from 'react';
import { LViewElement, DViewElement } from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface ObservedPropsSectionProps {
    view: LViewElement;
}

const ObservedPropsSection: React.FC<ObservedPropsSectionProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;
    const [newProp, setNewProp] = useState('');

    const observedProps: string[] = useMemo(() => {
        try {
            const raw = (dview as any).usageDeclarations;
            if (!raw) return [];
            if (typeof raw === 'string') {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            }
            if (Array.isArray(raw)) return raw;
            return [];
        } catch { return []; }
    }, [dview]);

    const updateProps = useCallback((updated: string[]) => {
        (view as any).usageDeclarations = JSON.stringify(updated);
    }, [view]);

    const handleAdd = useCallback(() => {
        const prop = newProp.trim();
        if (!prop || observedProps.includes(prop)) return;
        updateProps([...observedProps, prop]);
        setNewProp('');
    }, [newProp, observedProps, updateProps]);

    const handleDelete = useCallback((index: number) => {
        const updated = observedProps.filter((_, i) => i !== index);
        updateProps(updated);
    }, [observedProps, updateProps]);

    return (
        <CollapsibleSection
            title="Observed properties"
            badge={observedProps.length > 0 ? String(observedProps.length) : undefined}
            summary={observedProps.length === 0 ? 'none' : `${observedProps.length} tracked`}
        >
            <div className="vep-kv-list">
                {observedProps.map((prop, i) => (
                    <div key={i} className="vep-kv-list__row">
                        <span className="vep-kv-list__key vep-kv-list__key--full">{prop}</span>
                        <button
                            type="button"
                            className="vep-kv-list__delete"
                            onClick={() => handleDelete(i)}
                            title="Remove"
                        >
                            <i className="bi bi-trash3" />
                        </button>
                    </div>
                ))}
                {observedProps.length === 0 && (
                    <div className="vep-kv-list__empty">No observed properties</div>
                )}

                <div className="vep-kv-list__add-row">
                    <input
                        className="vep-kv-list__add-key vep-kv-list__add-key--full"
                        placeholder="property path"
                        value={newProp}
                        onChange={(e) => setNewProp(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button
                        type="button"
                        className="vep-kv-list__add-btn"
                        onClick={handleAdd}
                        disabled={!newProp.trim()}
                        title="Add property"
                    >
                        <i className="bi bi-plus" />
                    </button>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default ObservedPropsSection;
