/**
 * MappingTraceView Component
 * Displays the execution trace of a transformation
 */

import React, { useState, useCallback, useMemo } from 'react';

export interface TraceEntry {
    id: string;
    timestamp: number;
    sourceElement: {
        id: string;
        className: string;
        name?: string;
    };
    targetElement: {
        id: string;
        className: string;
        name?: string;
    };
    mappingRule: string;
    status: 'success' | 'partial' | 'failed';
    details?: string;
    attributeMappings?: {
        sourceAttr: string;
        targetAttr: string;
        sourceValue: any;
        targetValue: any;
    }[];
}

export interface MappingTraceViewProps {
    trace: TraceEntry[];
    onEntryClick?: (entry: TraceEntry) => void;
    onSourceClick?: (elementId: string) => void;
    onTargetClick?: (elementId: string) => void;
}

const STATUS_CONFIG = {
    success: {
        icon: 'bi-check-circle-fill',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        label: 'Success',
    },
    partial: {
        icon: 'bi-exclamation-circle-fill',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Partial',
    },
    failed: {
        icon: 'bi-x-circle-fill',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'Failed',
    },
};

export const MappingTraceView: React.FC<MappingTraceViewProps> = ({
    trace,
    onEntryClick,
    onSourceClick,
    onTargetClick,
}) => {
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Toggle entry expansion
    const toggleEntry = useCallback((entryId: string) => {
        setExpandedEntries(prev => {
            const next = new Set(prev);
            if (next.has(entryId)) {
                next.delete(entryId);
            } else {
                next.add(entryId);
            }
            return next;
        });
    }, []);

    // Filter trace entries
    const filteredTrace = useMemo(() => {
        return trace.filter(entry => {
            // Status filter
            if (filterStatus !== 'all' && entry.status !== filterStatus) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    entry.sourceElement.className.toLowerCase().includes(query) ||
                    entry.targetElement.className.toLowerCase().includes(query) ||
                    entry.mappingRule.toLowerCase().includes(query) ||
                    entry.sourceElement.name?.toLowerCase().includes(query) ||
                    entry.targetElement.name?.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [trace, filterStatus, searchQuery]);

    // Statistics
    const stats = useMemo(() => {
        return trace.reduce(
            (acc, entry) => {
                acc[entry.status]++;
                acc.total++;
                return acc;
            },
            { success: 0, partial: 0, failed: 0, total: 0 }
        );
    }, [trace]);

    return (
        <div className="jjtl-trace-view">
            {/* Header */}
            <div className="jjtl-trace-header">
                <h3 className="jjtl-trace-title">
                    <i className="bi bi-diagram-2" />
                    Mapping Trace
                </h3>
                <span className="jjtl-trace-count">{stats.total} mappings</span>
            </div>

            {/* Stats bar */}
            <div className="jjtl-trace-stats">
                <div className="jjtl-trace-stat jjtl-trace-stat--success">
                    <i className="bi bi-check-circle-fill" />
                    <span>{stats.success}</span>
                </div>
                <div className="jjtl-trace-stat jjtl-trace-stat--partial">
                    <i className="bi bi-exclamation-circle-fill" />
                    <span>{stats.partial}</span>
                </div>
                <div className="jjtl-trace-stat jjtl-trace-stat--failed">
                    <i className="bi bi-x-circle-fill" />
                    <span>{stats.failed}</span>
                </div>
            </div>

            {/* Search and filter */}
            <div className="jjtl-trace-controls">
                <div className="jjtl-trace-search">
                    <i className="bi bi-search" />
                    <input
                        type="text"
                        placeholder="Search mappings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="jjtl-trace-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="partial">Partial</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Trace entries */}
            <div className="jjtl-trace-list">
                {filteredTrace.length === 0 ? (
                    <div className="jjtl-trace-empty">
                        <i className="bi bi-inbox" />
                        <span>No trace entries</span>
                    </div>
                ) : (
                    filteredTrace.map(entry => {
                        const config = STATUS_CONFIG[entry.status];
                        const isExpanded = expandedEntries.has(entry.id);

                        return (
                            <div
                                key={entry.id}
                                className={`jjtl-trace-entry ${isExpanded ? 'expanded' : ''}`}
                            >
                                {/* Entry header */}
                                <div
                                    className="jjtl-trace-entry-header"
                                    onClick={() => toggleEntry(entry.id)}
                                >
                                    <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />

                                    <span
                                        className="jjtl-trace-status"
                                        style={{ color: config.color }}
                                    >
                                        <i className={`bi ${config.icon}`} />
                                    </span>

                                    <span className="jjtl-trace-mapping">
                                        <span
                                            className="jjtl-trace-class jjtl-trace-class--source"
                                            onClick={(e) => { e.stopPropagation(); onSourceClick?.(entry.sourceElement.id); }}
                                        >
                                            {entry.sourceElement.className}
                                        </span>
                                        <i className="bi bi-arrow-right" />
                                        <span
                                            className="jjtl-trace-class jjtl-trace-class--target"
                                            onClick={(e) => { e.stopPropagation(); onTargetClick?.(entry.targetElement.id); }}
                                        >
                                            {entry.targetElement.className}
                                        </span>
                                    </span>

                                    <span className="jjtl-trace-rule">
                                        {entry.mappingRule}
                                    </span>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="jjtl-trace-entry-body">
                                        {/* Source/Target names */}
                                        <div className="jjtl-trace-elements">
                                            <div className="jjtl-trace-element">
                                                <span className="jjtl-trace-element-label">Source:</span>
                                                <span className="jjtl-trace-element-value">
                                                    {entry.sourceElement.name || entry.sourceElement.id}
                                                </span>
                                            </div>
                                            <div className="jjtl-trace-element">
                                                <span className="jjtl-trace-element-label">Target:</span>
                                                <span className="jjtl-trace-element-value">
                                                    {entry.targetElement.name || entry.targetElement.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Attribute mappings */}
                                        {entry.attributeMappings && entry.attributeMappings.length > 0 && (
                                            <div className="jjtl-trace-attributes">
                                                <div className="jjtl-trace-attributes-header">
                                                    Attribute Mappings
                                                </div>
                                                <table className="jjtl-trace-attributes-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Source</th>
                                                            <th>Value</th>
                                                            <th></th>
                                                            <th>Target</th>
                                                            <th>Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {entry.attributeMappings.map((attr, idx) => (
                                                            <tr key={idx}>
                                                                <td>{attr.sourceAttr}</td>
                                                                <td className="jjtl-trace-value">
                                                                    {JSON.stringify(attr.sourceValue)}
                                                                </td>
                                                                <td><i className="bi bi-arrow-right" /></td>
                                                                <td>{attr.targetAttr}</td>
                                                                <td className="jjtl-trace-value">
                                                                    {JSON.stringify(attr.targetValue)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Details/error message */}
                                        {entry.details && (
                                            <div className="jjtl-trace-details">
                                                <i className="bi bi-info-circle" />
                                                {entry.details}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MappingTraceView;
