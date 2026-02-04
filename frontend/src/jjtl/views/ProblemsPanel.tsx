/**
 * ProblemsPanel Component
 * Displays parsing errors and warnings in a collapsible panel
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ParserError } from '../types';

export interface Problem {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column: number;
    source?: string;
}

export interface ProblemsPanelProps {
    problems: Problem[];
    onProblemClick?: (problem: Problem) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// Convert ParserError to Problem
export function parserErrorToProblem(error: ParserError, index: number): Problem {
    return {
        id: `error-${index}`,
        severity: 'error',
        message: error.message,
        line: error.line,
        column: error.column,
    };
}

const SEVERITY_CONFIG = {
    error: {
        icon: 'bi-x-circle-fill',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'Error',
    },
    warning: {
        icon: 'bi-exclamation-triangle-fill',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Warning',
    },
    info: {
        icon: 'bi-info-circle-fill',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        label: 'Info',
    },
};

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
    problems,
    onProblemClick,
    isCollapsed = false,
    onToggleCollapse,
}) => {
    const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

    // Count by severity
    const counts = useMemo(() => {
        return problems.reduce(
            (acc, p) => {
                acc[p.severity]++;
                acc.total++;
                return acc;
            },
            { error: 0, warning: 0, info: 0, total: 0 }
        );
    }, [problems]);

    // Filter problems
    const filteredProblems = useMemo(() => {
        if (filter === 'all') return problems;
        return problems.filter(p => p.severity === filter);
    }, [problems, filter]);

    // Handle problem click
    const handleProblemClick = useCallback((problem: Problem) => {
        onProblemClick?.(problem);
    }, [onProblemClick]);

    return (
        <div className={`jjtl-problems-panel ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header */}
            <div className="jjtl-problems-header" onClick={onToggleCollapse}>
                <div className="jjtl-problems-title">
                    <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'}`} />
                    <span>Problems</span>
                </div>

                {/* Counts */}
                <div className="jjtl-problems-counts">
                    {counts.error > 0 && (
                        <span className="jjtl-problems-count jjtl-problems-count--error">
                            <i className="bi bi-x-circle-fill" />
                            {counts.error}
                        </span>
                    )}
                    {counts.warning > 0 && (
                        <span className="jjtl-problems-count jjtl-problems-count--warning">
                            <i className="bi bi-exclamation-triangle-fill" />
                            {counts.warning}
                        </span>
                    )}
                    {counts.info > 0 && (
                        <span className="jjtl-problems-count jjtl-problems-count--info">
                            <i className="bi bi-info-circle-fill" />
                            {counts.info}
                        </span>
                    )}
                </div>
            </div>

            {/* Filter tabs */}
            {!isCollapsed && (
                <div className="jjtl-problems-filters">
                    <button
                        className={`jjtl-problems-filter ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({counts.total})
                    </button>
                    <button
                        className={`jjtl-problems-filter ${filter === 'error' ? 'active' : ''}`}
                        onClick={() => setFilter('error')}
                    >
                        Errors ({counts.error})
                    </button>
                    <button
                        className={`jjtl-problems-filter ${filter === 'warning' ? 'active' : ''}`}
                        onClick={() => setFilter('warning')}
                    >
                        Warnings ({counts.warning})
                    </button>
                </div>
            )}

            {/* Problems list */}
            {!isCollapsed && (
                <div className="jjtl-problems-list">
                    {filteredProblems.length === 0 ? (
                        <div className="jjtl-problems-empty">
                            <i className="bi bi-check-circle" />
                            <span>No problems detected</span>
                        </div>
                    ) : (
                        filteredProblems.map(problem => {
                            const config = SEVERITY_CONFIG[problem.severity];
                            return (
                                <div
                                    key={problem.id}
                                    className="jjtl-problems-item"
                                    onClick={() => handleProblemClick(problem)}
                                >
                                    <span
                                        className="jjtl-problems-icon"
                                        style={{ color: config.color }}
                                    >
                                        <i className={`bi ${config.icon}`} />
                                    </span>
                                    <span className="jjtl-problems-message">
                                        {problem.message}
                                    </span>
                                    <span className="jjtl-problems-location">
                                        Ln {problem.line}, Col {problem.column}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default ProblemsPanel;
