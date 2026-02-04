/**
 * Jodie Header Component
 * Window title bar with controls and metamodel indicator
 */

import { useState, useEffect } from 'react';
import { ProviderSelector } from './ProviderSelector';
import { TAIProvider, AIProvider } from '../../types/jodie';
import { DUser, L, LUser, LProject, LModel, store } from '../../joiner';
import { Selectors } from '../../redux/selectors/selectors';


interface JodieHeaderProps {
    activeProvider: TAIProvider;
    onProviderChange: (provider: TAIProvider) => void;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenDocumentation?: () => void;
    isWaiting?: boolean;
}

interface MetamodelContext {
    hasProject: boolean;
    projectName: string | null;
    metamodelName: string | null;
    metamodelCount: number;
}

/**
 * Get the current metamodel context
 */
function getMetamodelContext(): MetamodelContext {
    try {
        const user: LUser = L.fromPointer(DUser.current);
        if (!user?.project) {
            return { hasProject: false, projectName: null, metamodelName: null, metamodelCount: 0 };
        }

        const project = user.project as LProject;
        const projectName = project.name || 'Unnamed Project';
        const metamodels = (project as any).metamodels || [];

        if (metamodels.length === 0) {
            return { hasProject: true, projectName, metamodelName: null, metamodelCount: 0 };
        }

        // Try to get the active/selected metamodel
        const activeModel = Selectors.getActiveModel();
        let targetMetamodel: LModel | null = null;

        if (activeModel && activeModel.isMetamodel) {
            // Verify it belongs to this project
            const isInProject = metamodels.some((mm: any) => mm.id === activeModel.id);
            if (isInProject) {
                targetMetamodel = activeModel;
            }
        }

        // Fallback to first metamodel
        if (!targetMetamodel) {
            targetMetamodel = metamodels[0];
        }

        const metamodelName = targetMetamodel?.name || 'Unnamed';

        return {
            hasProject: true,
            projectName,
            metamodelName,
            metamodelCount: metamodels.length,
        };
    } catch {
        return { hasProject: false, projectName: null, metamodelName: null, metamodelCount: 0 };
    }
}

/**
 * Hook to get and subscribe to metamodel context changes
 */
function useMetamodelContext(): MetamodelContext {
    const [context, setContext] = useState<MetamodelContext>(() => getMetamodelContext());

    useEffect(() => {
        // Update context immediately
        setContext(getMetamodelContext());

        // Subscribe to Redux store changes
        const unsubscribe = store.subscribe(() => {
            const newContext = getMetamodelContext();
            setContext(prev => {
                // Only update if actually changed
                if (prev.metamodelName !== newContext.metamodelName ||
                    prev.metamodelCount !== newContext.metamodelCount ||
                    prev.hasProject !== newContext.hasProject) {
                    return newContext;
                }
                return prev;
            });
        });

        return () => unsubscribe();
    }, []);

    return context;
}

export function JodieHeader({
    activeProvider,
    onProviderChange,
    onClose,
    onOpenSettings,
    onOpenDocumentation,
    isWaiting,
}: JodieHeaderProps): JSX.Element {
    const context = useMetamodelContext();

    return (
        <div className="jodie-header">
            <div className="jodie-header-left">
                <div className="jodie-avatar">
                    <i className="bi bi-robot" />
                </div>
                <div className="jodie-title">
                    <span className="jodie-name">Jjodie</span>
                    <ProviderSelector
                        activeProvider={activeProvider}
                        onProviderChange={onProviderChange}
                        onOpenSettings={onOpenSettings}
                        disabled={isWaiting}
                    />
                </div>
            </div>

            {/* Metamodel Context Indicator */}
            <div className="jodie-header-center">
                {context.hasProject ? (
                    context.metamodelName ? (
                        <div className="jodie-metamodel-indicator" title={`Target: ${context.metamodelName}${context.metamodelCount > 1 ? ` (${context.metamodelCount} metamodels)` : ''}`}>
                            <i className="bi bi-diagram-3" />
                            <span className="jodie-metamodel-name">{context.metamodelName}</span>
                            {context.metamodelCount > 1 && (
                                <span className="jodie-metamodel-count">+{context.metamodelCount - 1}</span>
                            )}
                        </div>
                    ) : (
                        <div className="jodie-metamodel-indicator jodie-metamodel-warning" title="No metamodel in project">
                            <i className="bi bi-exclamation-triangle" />
                            <span>No metamodel</span>
                        </div>
                    )
                ) : (
                    <div className="jodie-metamodel-indicator jodie-metamodel-inactive" title="Open a project to use JjScript">
                        <i className="bi bi-folder2-open" />
                        <span>No project</span>
                    </div>
                )}
            </div>

            <div className="jodie-header-right">
                <button
                    className="jodie-header-btn"
                    onClick={onOpenSettings}
                    title="AI Settings"
                >
                    <i className="bi bi-gear" />
                </button>
                <button
                    className="jodie-header-btn jodie-close-btn"
                    onClick={onClose}
                    title="Close"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>
    );
}

export default JodieHeader;
