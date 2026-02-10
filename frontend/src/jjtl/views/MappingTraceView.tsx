/**
 * MappingTraceView Component
 * Rich, expandable trace view for JjTL transformation execution
 */

import React, { useState, useCallback, useMemo } from 'react';
import './MappingTraceView.scss';

export interface AttributeMapping {
    sourceAttr: string;
    targetAttr: string;
    sourceValue: any;
    targetValue: any;
    invertible?: boolean;
    expression?: string;
}

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
    status: 'success' | 'warning' | 'failed';
    details?: string;
    attributeMappings?: AttributeMapping[];
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
    warning: {
        icon: 'bi-exclamation-triangle-fill',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Warning',
    },
    failed: {
        icon: 'bi-x-circle-fill',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'Failed',
    },
};

/**
 * Format a value for display in trace view
 */
function formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (value.length <= 3) {
            return `[${value.map(v => formatValue(v)).join(', ')}]`;
        }
        return `[${value.slice(0, 2).map(v => formatValue(v)).join(', ')}, ... +${value.length - 2}]`;
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';
        if (keys.length <= 2) {
            return `{${keys.map(k => `${k}: ${formatValue(value[k])}`).join(', ')}}`;
        }
        return `{${keys.slice(0, 2).map(k => `${k}: ...`).join(', ')}, ...}`;
    }
    return String(value);
}

export const MappingTraceView: React.FC<MappingTraceViewProps> = ({
    trace,
    onEntryClick,
    onSourceClick,
    onTargetClick,
}) => {
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'warning' | 'failed'>('all');
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

    // Expand/collapse all
    const expandAll = useCallback(() => {
        setExpandedEntries(new Set(trace.map(e => e.id)));
    }, [trace]);

    const collapseAll = useCallback(() => {
        setExpandedEntries(new Set());
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
        let invertibleCount = 0;
        let totalBindings = 0;

        const result = trace.reduce(
            (acc, entry) => {
                acc[entry.status]++;
                acc.total++;

                // Count invertible bindings
                if (entry.attributeMappings) {
                    entry.attributeMappings.forEach(am => {
                        totalBindings++;
                        if (am.invertible) invertibleCount++;
                    });
                }

                return acc;
            },
            { success: 0, warning: 0, failed: 0, total: 0 }
        );

        return {
            ...result,
            invertibleCount,
            totalBindings,
            invertibilityRate: totalBindings > 0 ? Math.round((invertibleCount / totalBindings) * 100) : 0,
        };
    }, [trace]);

    const allExpanded = expandedEntries.size === trace.length && trace.length > 0;

    return (
        <div className="trace-view">
            {/* Header with stats */}
            <div className="trace-header">
                <div className="trace-header-left">
                    <h3 className="trace-title">
                        <i className="bi bi-diagram-2" />
                        Execution Trace
                    </h3>
                    <span className="trace-count">{stats.total} mappings</span>
                </div>
                <div className="trace-header-right">
                    <button
                        className="trace-expand-btn"
                        onClick={allExpanded ? collapseAll : expandAll}
                        title={allExpanded ? 'Collapse all' : 'Expand all'}
                    >
                        <i className={`bi ${allExpanded ? 'bi-arrows-collapse' : 'bi-arrows-expand'}`} />
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="trace-stats">
                <div className="trace-stat trace-stat--success">
                    <i className="bi bi-check-circle-fill" />
                    <span>{stats.success}</span>
                    <span className="trace-stat-label">Success</span>
                </div>
                <div className="trace-stat trace-stat--warning">
                    <i className="bi bi-exclamation-triangle-fill" />
                    <span>{stats.warning}</span>
                    <span className="trace-stat-label">Warning</span>
                </div>
                <div className="trace-stat trace-stat--failed">
                    <i className="bi bi-x-circle-fill" />
                    <span>{stats.failed}</span>
                    <span className="trace-stat-label">Failed</span>
                </div>
                {stats.totalBindings > 0 && (
                    <div className="trace-stat trace-stat--invertible">
                        <i className="bi bi-arrow-left-right" />
                        <span>{stats.invertibilityRate}%</span>
                        <span className="trace-stat-label">Invertible</span>
                    </div>
                )}
            </div>

            {/* Search and filter */}
            <div className="trace-controls">
                <div className="trace-search">
                    <i className="bi bi-search" />
                    <input
                        type="text"
                        placeholder="Search mappings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="trace-search-clear" onClick={() => setSearchQuery('')}>
                            <i className="bi bi-x" />
                        </button>
                    )}
                </div>
                <select
                    className="trace-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Trace entries */}
            <div className="trace-list">
                {filteredTrace.length === 0 ? (
                    <div className="trace-empty">
                        <i className="bi bi-inbox" />
                        <span>{trace.length === 0 ? 'No trace entries yet' : 'No matching entries'}</span>
                        {trace.length === 0 && (
                            <span className="trace-empty-hint">Run a transformation to see the execution trace</span>
                        )}
                    </div>
                ) : (
                    filteredTrace.map(entry => {
                        const config = STATUS_CONFIG[entry.status];
                        const isExpanded = expandedEntries.has(entry.id);
                        const hasBindings = entry.attributeMappings && entry.attributeMappings.length > 0;

                        return (
                            <div
                                key={entry.id}
                                className={`trace-entry ${isExpanded ? 'expanded' : ''} trace-entry--${entry.status}`}
                            >
                                {/* Entry header */}
                                <div
                                    className="trace-entry-header"
                                    onClick={() => toggleEntry(entry.id)}
                                >
                                    <i className={`trace-chevron bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />

                                    <span
                                        className="trace-status-icon"
                                        style={{ color: config.color }}
                                        title={config.label}
                                    >
                                        <i className={`bi ${config.icon}`} />
                                    </span>

                                    <div className="trace-mapping-info">
                                        <span className="trace-rule">{entry.mappingRule}</span>
                                        <span className="trace-elements">
                                            <span
                                                className="trace-element-link trace-element-link--source"
                                                onClick={(e) => { e.stopPropagation(); onSourceClick?.(entry.sourceElement.id); }}
                                                title={`Source: ${entry.sourceElement.name || entry.sourceElement.id}`}
                                            >
                                                {entry.sourceElement.name || entry.sourceElement.className}
                                            </span>
                                            <i className="bi bi-arrow-right trace-arrow" />
                                            <span
                                                className="trace-element-link trace-element-link--target"
                                                onClick={(e) => { e.stopPropagation(); onTargetClick?.(entry.targetElement.id); }}
                                                title={`Target: ${entry.targetElement.name || entry.targetElement.id}`}
                                            >
                                                {entry.targetElement.name || entry.targetElement.className}
                                            </span>
                                        </span>
                                    </div>

                                    {hasBindings && (
                                        <span className="trace-bindings-count">
                                            {entry.attributeMappings!.length} binding{entry.attributeMappings!.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="trace-entry-body">
                                        {/* Source/Target info */}
                                        <div className="trace-element-info">
                                            <div className="trace-element-row">
                                                <span className="trace-element-label">Source:</span>
                                                <span className="trace-element-class">{entry.sourceElement.className}</span>
                                                <span className="trace-element-name">
                                                    {entry.sourceElement.name || entry.sourceElement.id}
                                                </span>
                                            </div>
                                            <div className="trace-element-row">
                                                <span className="trace-element-label">Target:</span>
                                                <span className="trace-element-class">{entry.targetElement.className}</span>
                                                <span className="trace-element-name">
                                                    {entry.targetElement.name || entry.targetElement.id}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Attribute bindings */}
                                        {hasBindings && (
                                            <div className="trace-bindings">
                                                <div className="trace-bindings-header">
                                                    <span>Attribute Bindings</span>
                                                </div>
                                                <div className="trace-bindings-list">
                                                    {entry.attributeMappings!.map((binding, idx) => (
                                                        <div key={idx} className="trace-binding">
                                                            <div className="trace-binding-attrs">
                                                                <span className="trace-binding-source">
                                                                    {binding.sourceAttr}
                                                                </span>
                                                                <i className="bi bi-arrow-right trace-binding-arrow" />
                                                                <span className="trace-binding-target">
                                                                    {binding.targetAttr}
                                                                </span>
                                                                {binding.invertible && (
                                                                    <span className="trace-binding-invertible" title="Invertible mapping">
                                                                        <i className="bi bi-arrow-left-right" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="trace-binding-values">
                                                                <span className="trace-binding-value trace-binding-value--source">
                                                                    {formatValue(binding.sourceValue)}
                                                                </span>
                                                                <i className="bi bi-arrow-right trace-binding-arrow" />
                                                                <span className="trace-binding-value trace-binding-value--target">
                                                                    {formatValue(binding.targetValue)}
                                                                </span>
                                                            </div>
                                                            {binding.expression && (
                                                                <div className="trace-binding-expression">
                                                                    <i className="bi bi-code-slash" />
                                                                    <code>{binding.expression}</code>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Details/error message */}
                                        {entry.details && (
                                            <div className={`trace-details ${entry.status === 'failed' ? 'trace-details--error' : ''}`}>
                                                <i className={`bi ${entry.status === 'failed' ? 'bi-exclamation-circle' : 'bi-info-circle'}`} />
                                                <span>{entry.details}</span>
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
