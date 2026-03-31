import React, { useState, useCallback, useMemo } from 'react';
import { LViewElement, DViewElement } from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface ConstantsSectionProps {
    view: LViewElement;
}

const ConstantsSection: React.FC<ConstantsSectionProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const constants: Record<string, string> = useMemo(() => {
        try {
            const raw = (dview as any).constants;
            if (!raw) return {};
            if (typeof raw === 'string') return JSON.parse(raw);
            if (typeof raw === 'object') return { ...raw };
            return {};
        } catch { return {}; }
    }, [dview]);

    const entries = Object.entries(constants);

    const updateConstants = useCallback((updated: Record<string, string>) => {
        (view as any).constants = JSON.stringify(updated);
    }, [view]);

    const handleAdd = useCallback(() => {
        const key = newKey.trim();
        if (!key) return;
        updateConstants({ ...constants, [key]: newValue });
        setNewKey('');
        setNewValue('');
    }, [newKey, newValue, constants, updateConstants]);

    const handleDelete = useCallback((key: string) => {
        const updated = { ...constants };
        delete updated[key];
        updateConstants(updated);
    }, [constants, updateConstants]);

    const handleChangeValue = useCallback((key: string, value: string) => {
        updateConstants({ ...constants, [key]: value });
    }, [constants, updateConstants]);

    return (
        <CollapsibleSection
            title="Constants"
            badge={entries.length > 0 ? String(entries.length) : undefined}
            summary={entries.length === 0 ? 'none' : `${entries.length} defined`}
        >
            <div className="vep-kv-list">
                {entries.map(([key, val]) => (
                    <div key={key} className="vep-kv-list__row">
                        <span className="vep-kv-list__key">{key}</span>
                        <input
                            className="vep-kv-list__value"
                            value={val}
                            onChange={(e) => handleChangeValue(key, e.target.value)}
                        />
                        <button
                            type="button"
                            className="vep-kv-list__delete"
                            onClick={() => handleDelete(key)}
                            title="Delete"
                        >
                            <i className="bi bi-trash3" />
                        </button>
                    </div>
                ))}
                {entries.length === 0 && (
                    <div className="vep-kv-list__empty">No constants defined</div>
                )}

                {/* Add row */}
                <div className="vep-kv-list__add-row">
                    <input
                        className="vep-kv-list__add-key"
                        placeholder="key"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <input
                        className="vep-kv-list__add-value"
                        placeholder="value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button
                        type="button"
                        className="vep-kv-list__add-btn"
                        onClick={handleAdd}
                        disabled={!newKey.trim()}
                        title="Add constant"
                    >
                        <i className="bi bi-plus" />
                    </button>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default ConstantsSection;
