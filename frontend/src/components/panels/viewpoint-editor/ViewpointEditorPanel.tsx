import React, { useState, useCallback, useEffect } from 'react';
import { LViewPoint, LViewElement, LPointerTargetable, Pointer } from '../../../joiner';
import ViewpointEditorRoot from './ViewpointEditorRoot';
import ViewpointEditorBreadcrumb from './ViewpointEditorBreadcrumb';
import TemplateTab from './tabs/TemplateTab';
import StyleTab from './tabs/StyleTab';
import PredicateTab from './tabs/PredicateTab';
// ViewProperties and ViewConfiguration fields are now in the "Apply to" tab (PredicateTab)
import BehaviorSection from './sections/BehaviorSection';
import EdgeSection from './sections/EdgeSection';
import ConstantsSection from './sections/ConstantsSection';
import ObservedPropsSection from './sections/ObservedPropsSection';
import EventsSection from './sections/EventsSection';
import { setLastEditedViewpoint, clearLastEditedViewpoint } from '../../../utils/lastViewpoint';
import './viewpoint-editor.scss';

export interface ViewpointEditorPanelProps {
    viewpoint: LViewPoint;
    onClose: () => void;
    onViewSelect?: (viewId: string) => void;
}

const ViewpointEditorPanel: React.FC<ViewpointEditorPanelProps> = ({
    viewpoint,
    onClose,
    onViewSelect,
}) => {
    const [selectedView, setSelectedView] = useState<LViewElement | null>(null);
    const [activeTab, setActiveTab] = useState<'template' | 'style' | 'predicate'>('template');
    const [isExpertMode, setIsExpertMode] = useState(false);
    const [rootKey, setRootKey] = useState(0);

    // Register active viewpoint for context menu
    useEffect(() => {
        setLastEditedViewpoint(viewpoint.id, viewpoint.name || 'Viewpoint');
        return () => { clearLastEditedViewpoint(); };
    }, [viewpoint.id, viewpoint.name]);

    // Callback: "+" button in ViewpointEditorRoot created a view
    const handleViewCreated = useCallback(() => {
        setTimeout(() => setRootKey(k => k + 1), 600);
    }, []);

    // Listen for views created externally (canvas context menu)
    useEffect(() => {
        const handler = () => {
            setTimeout(() => setRootKey(k => k + 1), 600);
        };
        window.addEventListener('jjodel:viewCreated', handler);
        return () => window.removeEventListener('jjodel:viewCreated', handler);
    }, []);

    // Auto-navigate: when a canvas element is selected, find the matching view
    useEffect(() => {
        const handler = (e: Event) => {
            const { className } = (e as CustomEvent).detail || {};
            if (!className) return;
            // Walk all views in the viewpoint to find one whose oclCondition matches
            try {
                const views: LViewElement[] = (viewpoint as any).viewElements ?? (viewpoint as any).subViews ?? [];
                for (const v of views) {
                    const raw = (v as any).__raw ?? v;
                    const ocl: string = raw?.oclCondition ?? '';
                    // Match pattern: "context <ClassName> inv:"
                    if (ocl.includes(`context ${className} `)) {
                        setSelectedView(v);
                        setActiveTab('template');
                        return;
                    }
                }
            } catch {
                // Ignore errors in view resolution
            }
        };
        window.addEventListener('jjodel:canvas-element-selected', handler);
        return () => window.removeEventListener('jjodel:canvas-element-selected', handler);
    }, [viewpoint]);

    const handleViewSelect = useCallback((viewId: string) => {
        try {
            const resolved = LPointerTargetable.fromPointer(viewId as Pointer);
            if (resolved && (resolved as any).className) {
                setSelectedView(resolved as LViewElement);
                setActiveTab('template');
            }
        } catch {
            console.warn('[ViewpointEditorPanel] Could not resolve view:', viewId);
        }
    }, []);

    const handleBackToRoot = useCallback(() => {
        setSelectedView(null);
    }, []);

    return (
        <div className="vep">
            <ViewpointEditorBreadcrumb
                viewpoint={viewpoint}
                selectedView={selectedView}
                isExpertMode={isExpertMode}
                onToggleExpertMode={() => setIsExpertMode(v => !v)}
                onBackToRoot={handleBackToRoot}
                onClose={onClose}
            />

            {selectedView === null ? (
                <ViewpointEditorRoot
                    key={rootKey}
                    viewpoint={viewpoint}
                    onViewSelect={handleViewSelect}
                    onViewCreated={handleViewCreated}
                />
            ) : (
                <div className="vep-single-view">
                    {/* Tab bar */}
                    <div className="vep-tabs">
                        {(['predicate', 'template', 'style'] as const).map(tab => {
                            const label = tab === 'predicate' ? 'Apply to' : tab.charAt(0).toUpperCase() + tab.slice(1);
                            return (
                                <button
                                    key={tab}
                                    className={`vep-tabs__tab ${activeTab === tab ? 'vep-tabs__tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    {activeTab === 'template' && (
                        <TemplateTab
                            view={selectedView}
                            onViewUpdate={() => {/* trigger re-render if needed */}}
                        />
                    )}
                    {activeTab === 'style' && (
                        <StyleTab
                            view={selectedView}
                            onViewUpdate={() => {/* trigger re-render if needed */}}
                        />
                    )}
                    {activeTab === 'predicate' && (
                        <PredicateTab
                            view={selectedView}
                            viewpointId={viewpoint.id}
                            onViewUpdate={() => {/* trigger re-render if needed */}}
                        />
                    )}

                    {/* Expert-mode sections */}
                    <div className="vep-sections">
                        {isExpertMode && (
                            <>
                                <BehaviorSection view={selectedView} />
                                <EdgeSection view={selectedView} />
                                <ConstantsSection view={selectedView} />
                                <ObservedPropsSection view={selectedView} />
                                <EventsSection view={selectedView} />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewpointEditorPanel;
