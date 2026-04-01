import React, { useState, useCallback, useMemo } from 'react';
import { LViewElement, DViewElement } from '../../../../joiner';
import CollapsibleSection from './CollapsibleSection';

interface EventsSectionProps {
    view: LViewElement;
}

const DEFAULT_EVENTS = [
    { field: 'onDataUpdate', label: 'onDataUpdate' },
    { field: 'onDragStart', label: 'onDragStart' },
    { field: 'onDragEnd', label: 'onDragEnd' },
    { field: 'whileDragging', label: 'whileDragging' },
    { field: 'onResizeStart', label: 'onResizeStart' },
    { field: 'onResizeEnd', label: 'onResizeEnd' },
    { field: 'whileResizing', label: 'whileResizing' },
] as const;

const EventsSection: React.FC<EventsSectionProps> = ({ view }) => {
    const dview: DViewElement = view.__raw;
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [newEventName, setNewEventName] = useState('');
    const [newEventBody, setNewEventBody] = useState('');

    const setField = useCallback((field: string, value: any) => {
        (view as any)[field] = value;
    }, [view]);

    // Custom events dictionary
    const customEvents: Record<string, string> = useMemo(() => {
        try {
            const raw = (dview as any).events;
            if (!raw) return {};
            if (typeof raw === 'string') return JSON.parse(raw);
            if (typeof raw === 'object') return { ...raw };
            return {};
        } catch { return {}; }
    }, [dview]);

    const customEntries = Object.entries(customEvents);

    const updateCustomEvents = useCallback((updated: Record<string, string>) => {
        (view as any).events = JSON.stringify(updated);
    }, [view]);

    const handleAddCustom = useCallback(() => {
        const name = newEventName.trim();
        if (!name) return;
        updateCustomEvents({ ...customEvents, [name]: newEventBody });
        setNewEventName('');
        setNewEventBody('');
    }, [newEventName, newEventBody, customEvents, updateCustomEvents]);

    const handleDeleteCustom = useCallback((key: string) => {
        const updated = { ...customEvents };
        delete updated[key];
        updateCustomEvents(updated);
    }, [customEvents, updateCustomEvents]);

    const handleChangeCustomBody = useCallback((key: string, body: string) => {
        updateCustomEvents({ ...customEvents, [key]: body });
    }, [customEvents, updateCustomEvents]);

    const defaultCount = DEFAULT_EVENTS.filter(e => (dview as any)[e.field]).length;
    const summary = `${defaultCount}/7 default` + (customEntries.length > 0 ? `, ${customEntries.length} custom` : '');

    return (
        <CollapsibleSection
            title="Events"
            badge={`${DEFAULT_EVENTS.length + customEntries.length}`}
            summary={summary}
        >
            <div className="vep-events">
                {/* Default events */}
                <div className="vep-events__group-label">Default events</div>
                {DEFAULT_EVENTS.map(({ field, label }) => {
                    const value = (dview as any)[field] || '';
                    const isExpanded = expandedEvent === field;
                    return (
                        <div key={field} className="vep-events__item">
                            <button
                                type="button"
                                className="vep-events__item-header"
                                onClick={() => setExpandedEvent(isExpanded ? null : field)}
                            >
                                <span className="vep-events__item-chevron">{isExpanded ? '▾' : '▸'}</span>
                                <span className="vep-events__item-name">{label}</span>
                                {value && <span className="vep-events__item-dot" title="Has handler" />}
                            </button>
                            {isExpanded && (
                                <textarea
                                    className="vep-events__handler"
                                    value={value}
                                    onChange={(e) => setField(field, e.target.value)}
                                    placeholder={`// ${label} handler`}
                                    rows={4}
                                    spellCheck={false}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Custom events */}
                <div className="vep-events__group-label" style={{ marginTop: 8 }}>
                    Custom events
                    <span className="vep-events__group-count">{customEntries.length}</span>
                </div>
                {customEntries.map(([name, body]) => {
                    const isExpanded = expandedEvent === `custom:${name}`;
                    return (
                        <div key={name} className="vep-events__item">
                            <div className="vep-events__item-header">
                                <button
                                    type="button"
                                    className="vep-events__item-header-btn"
                                    onClick={() => setExpandedEvent(isExpanded ? null : `custom:${name}`)}
                                >
                                    <span className="vep-events__item-chevron">{isExpanded ? '▾' : '▸'}</span>
                                    <span className="vep-events__item-name">{name}</span>
                                </button>
                                <button
                                    type="button"
                                    className="vep-kv-list__delete"
                                    onClick={() => handleDeleteCustom(name)}
                                    title="Delete event"
                                >
                                    <i className="bi bi-trash3" />
                                </button>
                            </div>
                            {isExpanded && (
                                <textarea
                                    className="vep-events__handler"
                                    value={body}
                                    onChange={(e) => handleChangeCustomBody(name, e.target.value)}
                                    placeholder={`// ${name} handler`}
                                    rows={4}
                                    spellCheck={false}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Add custom event */}
                <div className="vep-events__add-row">
                    <input
                        className="vep-kv-list__add-key"
                        placeholder="event name"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                    />
                    <button
                        type="button"
                        className="vep-kv-list__add-btn"
                        onClick={handleAddCustom}
                        disabled={!newEventName.trim()}
                        title="Add custom event"
                    >
                        <i className="bi bi-plus" />
                    </button>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default EventsSection;
