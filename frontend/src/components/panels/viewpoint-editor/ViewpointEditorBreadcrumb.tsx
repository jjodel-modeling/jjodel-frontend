import React from 'react';
import { LViewPoint, LViewElement } from '../../../joiner';
import { getViewpointType, ViewpointType } from '../../../view/viewPoint/viewpoint';

interface ViewpointEditorBreadcrumbProps {
    viewpoint: LViewPoint;
    selectedView: LViewElement | null;
    isExpertMode: boolean;
    onToggleExpertMode: () => void;
    onBackToRoot: () => void;
    onClose: () => void;
}

const typeBadgeColors: Record<ViewpointType, { bg: string; color: string }> = {
    syntax:          { bg: '#dbeafe', color: '#1e40af' },
    decoration:      { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
    validation:      { bg: '#fef3c7', color: '#92400e' },
    semantics:       { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    editor_behavior: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

/** Build the breadcrumb path segments for a view (walk up via father) */
function buildViewPath(view: LViewElement, viewpoint: LViewPoint): string[] {
    const segments: string[] = [];
    let current: LViewElement | null = view;

    // Walk up the parent chain
    while (current) {
        segments.unshift(current.name || 'Unnamed');
        try {
            const fatherId = current.__raw?.father;
            if (!fatherId || fatherId === viewpoint.id) break;
            const parent = current.father as LViewElement | undefined;
            if (!parent || parent.id === viewpoint.id) break;
            current = parent;
        } catch {
            break;
        }
    }

    return segments;
}

const ViewpointEditorBreadcrumb: React.FC<ViewpointEditorBreadcrumbProps> = ({
    viewpoint,
    selectedView,
    isExpertMode,
    onToggleExpertMode,
    onBackToRoot,
    onClose,
}) => {
    const vpType = getViewpointType(viewpoint.__raw);
    const badge = typeBadgeColors[vpType];
    const vpName = viewpoint.name || 'Unnamed';

    if (selectedView === null) {
        // Root mode
        return (
            <div className="vep-breadcrumb">
                <div className="vep-breadcrumb__path">
                    <button
                        className="vep-breadcrumb__close"
                        onClick={onClose}
                        title="Close viewpoint editor"
                    >
                        <i className="bi bi-arrow-left" />
                    </button>
                    <span
                        className="vep-breadcrumb__badge"
                        style={{ background: badge.bg, color: badge.color }}
                    >
                        {vpType.replace('_', ' ')}
                    </span>
                    <span className="vep-breadcrumb__segment vep-breadcrumb__segment--current">
                        {vpName}
                    </span>
                </div>
            </div>
        );
    }

    // Single view mode
    const viewPath = buildViewPath(selectedView, viewpoint);

    return (
        <div className="vep-breadcrumb">
            <div className="vep-breadcrumb__path">
                <button
                    className="vep-breadcrumb__back"
                    onClick={onBackToRoot}
                    title="Back to viewpoint root"
                >
                    <i className="bi bi-arrow-left" />
                    <span>{vpName}</span>
                </button>
                {viewPath.map((segment, i) => (
                    <React.Fragment key={i}>
                        <span className="vep-breadcrumb__separator">›</span>
                        <span
                            className={`vep-breadcrumb__segment ${
                                i === viewPath.length - 1 ? 'vep-breadcrumb__segment--current' : ''
                            }`}
                        >
                            {segment}
                        </span>
                    </React.Fragment>
                ))}
            </div>
            <div className="vep-breadcrumb__actions">
                <span
                    className={`vep-breadcrumb__mode ${!isExpertMode ? 'vep-breadcrumb__mode--active' : ''}`}
                    onClick={() => { if (isExpertMode) onToggleExpertMode(); }}
                >
                    Basic
                </span>
                <span
                    className={`vep-breadcrumb__mode ${isExpertMode ? 'vep-breadcrumb__mode--active' : ''}`}
                    onClick={() => { if (!isExpertMode) onToggleExpertMode(); }}
                >
                    Expert
                </span>
            </div>
        </div>
    );
};

export default ViewpointEditorBreadcrumb;
