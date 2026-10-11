/**
 * Jodie Header Component
 * Window title bar with controls and metamodel indicator
 */

import { useState, useEffect } from 'react';
import { ProviderModelSelector } from '../common/ProviderModelSelector';
import { TAIProvider, AIProvider, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor, CONSOLE_MODES, CONSOLE_MODE_LABELS } from '../../types/jodie';
import { DUser, L, LUser, LProject, LModel, store } from '../../joiner';
import { Selectors } from '../../redux/selectors/selectors';
import { JjodelEvents, EnvGenEvents } from '../../events/registry';
import { getActiveModel } from '../../jjscript/executor/utils';
import { isConsumerMode } from '../environment/consumerMode';
import { describeConsumerSelection, getConsumerSelection } from '../environment/consumerJodieContext';
import { consumerFocusLabel } from './consumerVoice';


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
    /** Active console mode (Jjodie / JjScript / JjEL). */
    consoleMode: ConsoleMode;
    onConsoleModeChange: (m: ConsoleMode, via?: ConsoleModeSwitchVia) => void;
    /** Active code flavor (JjEL / JS). JS is disabled in stage 1. */
    codeFlavor: CodeFlavor;
    onCodeFlavorChange: (f: CodeFlavor) => void;
    /** Clear all entries of the active console mode (Chat or Code). Optional for backward compat. */
    onClearCurrentMode?: () => void;
    /** True iff the active console mode has at least one entry. Used to switch the aria-label. */
    canClearCurrentMode?: boolean;
}

interface MetamodelContext {
    hasProject: boolean;
    projectName: string | null;
    metamodelName: string | null;
    metamodelCount: number;
    level: 'M1' | 'M2';
}

/**
 * Get the current metamodel context
 */
function getMetamodelContext(): MetamodelContext {
    try {
        const user: LUser = L.fromPointer(DUser.current);
        if (!user?.project) {
            return { hasProject: false, projectName: null, metamodelName: null, metamodelCount: 0, level: 'M2' };
        }

        const project = user.project as LProject;
        const projectName = project.name || 'Unnamed Project';
        const metamodels = (project as any).metamodels || [];

        if (metamodels.length === 0) {
            return { hasProject: true, projectName, metamodelName: null, metamodelCount: 0, level: 'M2' };
        }

        // Try to get the active/selected metamodel — prefer the cache populated
        // by EDITOR_TYPE_CHANGE listener, fall back to the legacy selector.
        const activeModel = getActiveModel() ?? Selectors.getActiveModel();
        let targetMetamodel: LModel | null = null;

        if (activeModel && activeModel.isMetamodel) {
            // M2: verify it belongs to this project
            const isInProject = metamodels.some((mm: any) => mm.id === activeModel.id);
            if (isInProject) {
                targetMetamodel = activeModel;
            }
        } else if (activeModel && !activeModel.isMetamodel) {
            // M1: active artefact is a model instance — show the model itself
            targetMetamodel = activeModel;
        }

        // Fallback to first metamodel
        if (!targetMetamodel) {
            targetMetamodel = metamodels[0];
        }

        const metamodelName = targetMetamodel?.name || 'Unnamed';
        const level: 'M1' | 'M2' = targetMetamodel?.isMetamodel ? 'M2' : 'M1';

        return {
            hasProject: true,
            projectName,
            metamodelName,
            metamodelCount: metamodels.length,
            level,
        };
    } catch {
        return { hasProject: false, projectName: null, metamodelName: null, metamodelCount: 0, level: 'M2' };
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

        // Refresh the badge on tab switches (rc-dock layout change), independent
        // of redux churn. The EDITOR_TYPE_CHANGE event fires on tab open/switch
        // and carries the active modelId in its detail.
        const handleEditorChange = () => setContext(getMetamodelContext());
        window.addEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handleEditorChange);

        return () => {
            unsubscribe();
            window.removeEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handleEditorChange);
        };
    }, []);

    return context;
}

/** #168 J7 — what the consumer is looking at in the Configurator, as the chat line says it. */
function readConsumerFocus(): { text: string; title: string } | null {
    if (!isConsumerMode()) return null;
    try {
        return consumerFocusLabel(describeConsumerSelection(getConsumerSelection(), (store.getState() as any).idlookup));
    } catch {
        return null;
    }
}

/**
 * The consumer's focus, refreshed when the Configurator publishes a selection, when the store
 * changes (a rename) and when the hash changes (`&profile=` added or removed).
 */
function useConsumerFocus(): { text: string; title: string } | null {
    const [focus, setFocus] = useState(() => readConsumerFocus());

    useEffect(() => {
        const refresh = () => {
            const next = readConsumerFocus();
            setFocus(prev => (prev?.text === next?.text && prev?.title === next?.title ? prev : next));
        };
        refresh();
        const unsubscribe = store.subscribe(refresh);
        window.addEventListener(EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED, refresh);
        window.addEventListener('hashchange', refresh);
        return () => {
            unsubscribe();
            window.removeEventListener(EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED, refresh);
            window.removeEventListener('hashchange', refresh);
        };
    }, []);

    return focus;
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
    onClearCurrentMode,
    canClearCurrentMode,
}: JodieHeaderProps): JSX.Element {
    const context = useMetamodelContext();
    // #168 J7: the consumer has one mode and sees its focus, not a metamodel.
    const consumer = isConsumerMode();
    const consumerFocus = useConsumerFocus();
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

                {/* Console mode switcher — segmented pill, always visible.
                    All three options shown → active highlight moves, no layout shift.
                    #168 J7: not in the consumer, who has natural language only. */}
                {!consumer && (
                    <div className="jodie-mode-switch" role="tablist" aria-label="Console mode">
                        {CONSOLE_MODES.map(m => (
                            <button
                                key={m}
                                type="button"
                                role="tab"
                                aria-selected={consoleMode === m}
                                className={`jodie-mode-switch__opt${consoleMode === m ? ' jodie-mode-switch__opt--active' : ''}`}
                                onClick={() => onConsoleModeChange(m, 'pill')}
                                title={`Switch to ${CONSOLE_MODE_LABELS[m]} (Cmd+J / Ctrl+.)`}
                            >
                                {CONSOLE_MODE_LABELS[m]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Metamodel Context Indicator. #168 J7: in the consumer, the focus of the
                Configurator in the chat line's words, or nothing. */}
            <div className="jodie-header-center">
                {consumer ? (
                    consumerFocus && (
                        <div className="jodie-metamodel-indicator" title={consumerFocus.title}>
                            <i className="bi bi-eye" />
                            <span className="jodie-metamodel-name">{consumerFocus.text}</span>
                        </div>
                    )
                ) : context.hasProject ? (
                    context.metamodelName ? (
                        <div className="jodie-metamodel-indicator" title={`Target: ${context.metamodelName}${context.metamodelCount > 1 ? ` (${context.metamodelCount} metamodels)` : ''}`}>
                            <i className="bi bi-diagram-3" />
                            <span className="jodie-metamodel-name">
                                <span className="jodie-metamodel-level">{context.level} · </span>
                                {context.metamodelName}
                            </span>
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
                {onClearCurrentMode && (
                    <button
                        className="jodie-header-btn"
                        onClick={onClearCurrentMode}
                        title={consoleMode === 'jjel' ? 'Clear console history' : 'Clear chat history'}
                        aria-label={consoleMode === 'jjel' ? 'Clear console history' : 'Clear chat history'}
                    >
                        <i className="bi bi-eraser" />
                    </button>
                )}
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
                    className="jodie-header-btn jodie-close-btn"
                    onClick={onClose}
                    title="Close"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>

        {consoleMode === 'jjel' && (
            <div className="jodie-code-subrow">
                <div className="jodie-code-scope" title="Variables available in JjEL expressions">
                    scope: self, model, classes
                </div>
            </div>
        )}
        </>
    );
}

export default JodieHeader;
