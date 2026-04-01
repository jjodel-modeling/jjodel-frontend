import React from 'react';
import {LViewPoint, LProject, LModel, Pointer} from '../../../joiner';
import {getViewpointType, ViewpointType} from '../../../view/viewPoint/viewpoint';

interface ViewpointBreadcrumbProps {
    viewpoint: LViewPoint;
    project: LProject;
    availableModels: LModel[];
    selectedModelId: string | null;
    onModelSelect: (modelId: string | null) => void;
    isExpertMode: boolean;
    onToggleExpertMode: () => void;
}

const typeBadgeColors: Record<ViewpointType, { bg: string; color: string }> = {
    syntax:          { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
    decoration:      { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
    validation:      { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    semantics:       { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    editor_behavior: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

const ViewpointBreadcrumb: React.FC<ViewpointBreadcrumbProps> = ({
    viewpoint,
    project,
    availableModels,
    selectedModelId,
    onModelSelect,
    isExpertMode,
    onToggleExpertMode,
}) => {
    const vpType = getViewpointType(viewpoint.__raw);
    const badge = typeBadgeColors[vpType];
    const projectName = project?.name || 'Project';

    return (
        <div className="viewpoint-breadcrumb">
            <div className="viewpoint-breadcrumb__path">
                <span className="viewpoint-breadcrumb__segment">{projectName}</span>
                <span className="viewpoint-breadcrumb__separator">›</span>
                <span className="viewpoint-breadcrumb__segment viewpoint-breadcrumb__segment--current">
                    {viewpoint.name || 'Unnamed'}
                </span>
                <span
                    className="viewpoint-breadcrumb__badge"
                    style={{ background: badge.bg, color: badge.color }}
                >
                    {vpType.replace('_', ' ')}
                </span>
            </div>
            <div className="viewpoint-breadcrumb__actions">
                <span className="viewpoint-breadcrumb__label">Preview:</span>
                <select
                    className="viewpoint-breadcrumb__select"
                    value={selectedModelId || ''}
                    onChange={(e) => onModelSelect(e.target.value || null)}
                >
                    <option value="">None</option>
                    {availableModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name || 'Unnamed model'}</option>
                    ))}
                </select>
                <button
                    className={`viewpoint-breadcrumb__mode-toggle ${isExpertMode ? 'viewpoint-breadcrumb__mode-toggle--active' : ''}`}
                    onClick={onToggleExpertMode}
                    title={isExpertMode ? 'Switch to Basic' : 'Switch to Expert'}
                >
                    {isExpertMode ? 'Expert' : 'Basic'}
                </button>
            </div>
        </div>
    );
};

export default ViewpointBreadcrumb;
