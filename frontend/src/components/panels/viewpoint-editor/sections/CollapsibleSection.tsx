import React, { useState } from 'react';

export interface CollapsibleSectionProps {
    title: string;
    badge?: string;
    summary?: string;
    defaultExpanded?: boolean;
    children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    badge,
    summary,
    defaultExpanded = false,
    children,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className="vep-section">
            <button
                type="button"
                className="vep-section__header"
                onClick={() => setExpanded(v => !v)}
            >
                <span className="vep-section__chevron">{expanded ? '▾' : '▸'}</span>
                <span className="vep-section__title">{title}</span>
                {badge && <span className="vep-section__badge">{badge}</span>}
                {!expanded && summary && (
                    <span className="vep-section__summary">{summary}</span>
                )}
            </button>
            {expanded && (
                <div className="vep-section__body">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
