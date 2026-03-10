import React, { useState, useCallback } from 'react';
import { useConformance } from './useConformance';
import type { ConformanceStatus } from './ConformanceTypes';

interface ConformanceIndicatorProps {
    modelId: string;
}

const STATUS_CONFIG: Record<ConformanceStatus, { color: string; icon: string; label: string }> = {
    conformant: { color: '#0ea5e9', icon: 'bi-check-circle-fill', label: 'Conformant' },
    warnings:   { color: '#f59e0b', icon: 'bi-exclamation-circle-fill', label: '' },
    errors:     { color: '#ef4444', icon: 'bi-x-circle-fill', label: '' },
    unknown:    { color: '#94a3b8', icon: 'bi-question-circle-fill', label: 'Unknown' },
};

function formatTooltip(status: ConformanceStatus, errorCount: number, warningCount: number): string {
    if (status === 'conformant') return 'Conformant';
    if (status === 'unknown') return 'Conformance unknown';

    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    return parts.join(', ');
}

export function ConformanceIndicator({ modelId }: ConformanceIndicatorProps) {
    const result = useConformance(modelId);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
    const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

    if (!result) return null;

    const { status, violations } = result;
    const config = STATUS_CONFIG[status];

    // Don't show dot for conformant models (they're fine)
    if (status === 'conformant') return null;

    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const tooltipText = formatTooltip(status, errorCount, warningCount);

    return (
        <span
            className="conformance-indicator"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}
        >
            <i
                className={`bi ${config.icon}`}
                style={{ color: config.color, fontSize: '10px', lineHeight: 1 }}
            />
            {showTooltip && (
                <span className="conformance-tooltip">
                    {tooltipText}
                </span>
            )}
        </span>
    );
}
