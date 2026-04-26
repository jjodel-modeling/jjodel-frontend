/**
 * Jodie Header Component
 * Window title bar with controls and metamodel indicator
 */

import { useState, useEffect } from 'react';
import { ProviderModelSelector } from '../common/ProviderModelSelector';
import { TAIProvider, AIProvider, ConsoleMode, CodeFlavor } from '../../types/jodie';
import { DUser, L, LUser, LProject, LModel, store } from '../../joiner';
import { Selectors } from '../../redux/selectors/selectors';


interface JodieHeaderProps {
    activeProvider: TAIProvider;
    onProviderChange: (provider: TAIProvider) => void;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenDocumentation?: () => void;
    isWaiting?: boolean;
    /** Whether at least one AI provider is configured */
    isAlive?: boolean;
    /** Whether the window is currently in fullscreen mode */
    isFullscreen?: boolean;
    /** Toggle fullscreen on/off (parent decides which based on isFullscreen) */
    onToggleFullscreen?: () => void;
    /** Reset window to default position and size */
    onResetPosition?: () => void;
    /** Active console mode (Chat / Code). */
    consoleMode: ConsoleMode;
    onConsoleModeChange: (m: ConsoleMode) => void;
    /** Active code flavor (JjEL / JS). JS is disabled in stage 1. */
    codeFlavor: CodeFlavor;
    onCodeFlavorChange: (f: CodeFlavor) => void;
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
    isAlive,
    isFullscreen,
    onToggleFullscreen,
    onResetPosition,
    consoleMode,
    onConsoleModeChange,
    codeFlavor,
    onCodeFlavorChange,
}: JodieHeaderProps): JSX.Element {
    const context = useMetamodelContext();
    const aliveTitle = isAlive
        ? 'AI provider connected'
        : 'No AI provider configured. Open Settings to add one.';

    return (
        <>
        <div className="jodie-header">
            <div className="jodie-header-left">
                <div className="jodie-avatar">
                    <i className="bi bi-robot" />
                </div>
                <div className="jodie-title">
                    <span className="jodie-name">
                        Jjodie
                        <span
                            className={`jodie-alive-dot ${isAlive ? 'jodie-alive-dot--alive' : 'jodie-alive-dot--idle'}`}
                            title={aliveTitle}
                            aria-label={aliveTitle}
                        />
                    </span>
                    <ProviderModelSelector
                        feature="chat"
                        compact
                        onNavigateToSettings={onOpenSettings}
                    />
                </div>

                {/* Console mode switch (Chat / Code). Right of the title block. */}
                <div className="jodie-mode-switch" role="tablist" aria-label="Console mode">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={consoleMode === 'chat'}
                        className={`jodie-mode-switch__opt${consoleMode === 'chat' ? ' jodie-mode-switch__opt--active' : ''}`}
                        onClick={() => onConsoleModeChange('chat')}
                        title="Chat with Jjodie (Cmd+J)"
                    >
                        Chat
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={consoleMode === 'code'}
                        className={`jodie-mode-switch__opt${consoleMode === 'code' ? ' jodie-mode-switch__opt--active' : ''}`}
                        onClick={() => onConsoleModeChange('code')}
                        title="Evaluate code against the model (Cmd+J)"
                    >
                        Code
                    </button>
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
                {onResetPosition && (
                    <button
                        className="jodie-header-btn jodie-reset-btn"
                        onClick={onResetPosition}
                        title="Reset position and size"
                        aria-label="Reset Jjodie window to default position and size"
                    >
                        <i className="bi bi-arrow-counterclockwise" />
                    </button>
                )}
                {onToggleFullscreen && (
                    <button
                        className={`jodie-header-btn ${isFullscreen ? 'jodie-fullscreen-exit-btn' : 'jodie-fullscreen-btn'}`}
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
                    >
                        <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`} />
                    </button>
                )}
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

        {consoleMode === 'code' && (
            <div className="jodie-code-subrow">
                <div className="jodie-flavor-switch" role="tablist" aria-label="Code flavor">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={codeFlavor === 'jjel'}
                        className={`jodie-flavor-switch__opt${codeFlavor === 'jjel' ? ' jodie-flavor-switch__opt--active' : ''}`}
                        onClick={() => onCodeFlavorChange('jjel')}
                        title="Evaluate JjEL expressions"
                    >
                        JjEL
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={false}
                        aria-disabled={true}
                        disabled
                        className="jodie-flavor-switch__opt jodie-flavor-switch__opt--disabled"
                        title="JS flavor is coming next"
                    >
                        JS
                        <span className="jodie-flavor-switch__badge">coming next</span>
                    </button>
                </div>
                <div className="jodie-code-scope" title="Variables available in JjEL expressions">
                    scope: self, model, classes
                </div>
            </div>
        )}
        </>
    );
}

export default JodieHeader;
