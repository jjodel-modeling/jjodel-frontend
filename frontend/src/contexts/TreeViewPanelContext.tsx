/**
 * TreeViewPanelContext
 * Gestisce lo stato di apertura/chiusura del Tree View panel
 * e permette il controllo programmatico da altri componenti
 *
 * Includes element highlighting for live script execution feedback.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { JjodelEvents, JjScriptEvents, SystemEvents } from '../events/registry';

export type ElementAction = 'create' | 'modify' | 'delete' | 'unknown';
export type EditorType = 'model' | 'metamodel' | 'transformation' | 'summary' | null;

interface TreeViewPanelContextType {
    /** Panel is visible/expanded */
    isVisible: boolean;
    /** Expand the panel */
    show: () => void;
    /** Collapse the panel */
    hide: () => void;
    /** Toggle panel state */
    toggle: () => void;
    /** Attention call for programmatic/automated triggers: highlight when the
     *  panel is visible, otherwise a pulse on the collapsed toggle. Never opens. */
    showWithHighlight: () => void;
    /** Whether panel is currently highlighted (animation active) */
    isHighlighted: boolean;
    /** Whether script is currently executing */
    isScriptExecuting: boolean;
    /** Brief attention signal for the collapsed tree toggle (auto-clears ~2.5s).
     *  Set instead of force-opening the panel when an event arrives while collapsed. */
    attentionPulse: boolean;

    // Element highlighting
    /** Currently highlighted element ID */
    highlightedElementId: string | null;
    /** Action type for the highlighted element */
    highlightedAction: ElementAction | null;
    /** Set highlighted element (auto-clears after delay) */
    highlightElement: (elementId: string, action?: ElementAction, duration?: number) => void;
    /** Clear highlight immediately */
    clearHighlight: () => void;
    /** Element IDs that should be auto-expanded */
    expandedNodeIds: Set<string>;
    /** Add node to expanded set */
    expandNode: (nodeId: string) => void;
    /** Collapse node */
    collapseNode: (nodeId: string) => void;
    /** Toggle node expansion */
    toggleNode: (nodeId: string) => void;
    /** Currently active editor type (drives panel visibility matrix) */
    activeEditorType: EditorType;
    /** Set active editor type */
    setActiveEditorType: (type: EditorType) => void;

    // ─── Inspector zone of the right rail ───
    /** Inspector (Properties) zone is expanded */
    isInspectorVisible: boolean;
    /** Expand the inspector zone */
    showInspector: () => void;
    /** Toggle the inspector zone */
    toggleInspector: () => void;
}

const TreeViewPanelContext = createContext<TreeViewPanelContextType | null>(null);

const STORAGE_KEY_VISIBLE = 'jjodel_treeview_visible';
// Inspector visibility. Historically local state inside PropertiesWithTreeView; it moved
// here when the rail header was retired (2026-08-26) and its collapse control went up into
// the canvas topbar, which lives in a different subtree: two components read the same zone,
// so the state cannot stay private to one of them. Same key as before, so a user's
// persisted preference survives the move untouched.
const STORAGE_KEY_INSPECTOR_VISIBLE = 'jjodel_property_panel_visible';

/**
 * Extract action from JjScript command
 */
function getActionFromCommand(command: string): ElementAction {
    const trimmed = command.trim().toLowerCase();
    if (trimmed.startsWith('create ')) return 'create';
    if (trimmed.startsWith('delete ') || trimmed.startsWith('remove ')) return 'delete';
    if (trimmed.startsWith('set ') || trimmed.startsWith('rename ')) return 'modify';
    return 'unknown';
}

export const TreeViewPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load initial state from localStorage
    const [isVisible, setIsVisible] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_VISIBLE);
        return stored !== null ? stored === 'true' : true; // Default: visible
    });

    // Inspector zone visibility. Default true, as it has always been.
    const [isInspectorVisible, setIsInspectorVisible] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem(STORAGE_KEY_INSPECTOR_VISIBLE);
        return stored !== null ? stored === 'true' : true;
    });

    const [isHighlighted, setIsHighlighted] = useState(false);
    const [isScriptExecuting, setIsScriptExecuting] = useState(false);
    // Attention pulse: brief visual signal on the collapsed tree toggle, used in
    // place of force-opening the panel when it is collapsed (2026-07-05 decoupling).
    const [attentionPulse, setAttentionPulse] = useState(false);

    // Active editor type (drives panel visibility matrix)
    const [activeEditorType, setActiveEditorType] = useState<EditorType>(null);

    // Element highlighting state
    const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
    const [highlightedAction, setHighlightedAction] = useState<ElementAction | null>(null);
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const attentionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Persist visibility state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_VISIBLE, String(isVisible));
    }, [isVisible]);


    const show = useCallback(() => {
        setIsVisible(true);
    }, []);

    const hide = useCallback(() => {
        setIsVisible(false);
    }, []);

    const toggle = useCallback(() => {
        setIsVisible(prev => !prev);
    }, []);

    // Persist inspector visibility. Kept separate from the tree's own key: the two zones
    // collapse independently (R-RAIL-11) and always have.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_INSPECTOR_VISIBLE, String(isInspectorVisible));
        } catch { /* ignore */ }
    }, [isInspectorVisible]);

    const showInspector = useCallback(() => {
        setIsInspectorVisible(true);
    }, []);

    const toggleInspector = useCallback(() => {
        setIsInspectorVisible(prev => !prev);
    }, []);

    // Fire a brief attention pulse on the collapsed tree toggle (~2.5s).
    // Replaces force-opening the panel: visibility belongs to the user.
    const signalAttention = useCallback(() => {
        if (attentionTimeoutRef.current) {
            clearTimeout(attentionTimeoutRef.current);
        }
        setAttentionPulse(true);
        attentionTimeoutRef.current = setTimeout(() => {
            setAttentionPulse(false);
        }, 2500);
    }, []);

    // Programmatic/automated attention call. Never force-opens the panel:
    // if the tree is visible, plays the highlight animation as before; if it
    // is collapsed, signals attention on the collapsed toggle (pulse dot).
    const showWithHighlight = useCallback(() => {
        if (isVisible) {
            // Trigger highlight animation
            setIsHighlighted(true);
            setTimeout(() => {
                setIsHighlighted(false);
            }, 1200);
        } else {
            signalAttention();
        }
    }, [isVisible, signalAttention]);

    // Element highlighting functions
    const highlightElement = useCallback((elementId: string, action: ElementAction = 'unknown', duration = 2000) => {
        // Clear previous timeout
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        setHighlightedElementId(elementId);
        setHighlightedAction(action);

        // Use longer duration for 'create' actions
        const actualDuration = action === 'create' ? 2500 : duration;

        // Auto-clear after duration
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedElementId(null);
            setHighlightedAction(null);
        }, actualDuration);
    }, []);

    const clearHighlight = useCallback(() => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }
        setHighlightedElementId(null);
        setHighlightedAction(null);
    }, []);

    const expandNode = useCallback((nodeId: string) => {
        setExpandedNodeIds(prev => new Set([...prev, nodeId]));
    }, []);

    const collapseNode = useCallback((nodeId: string) => {
        setExpandedNodeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(nodeId);
            return newSet;
        });
    }, []);

    const toggleNode = useCallback((nodeId: string) => {
        setExpandedNodeIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    // Listen for editor type changes (drives panel visibility matrix)
    useEffect(() => {
        const handler = (e: Event) => {
            const { editorType } = (e as CustomEvent).detail;
            setActiveEditorType(editorType);
            // 2026-07-05 decoupling: editor changes no longer force-open the tree.
            // Panel visibility is the user's preference; only the active editor type
            // is tracked here (still drives the Dock visibility matrix downstream).
        };
        window.addEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handler);
        return () => window.removeEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handler);
    }, []);

    // Listen for JjScript execution events
    useEffect(() => {
        /**
         * When script execution STARTS
         */
        const handleExecutionStart = (event: Event) => {
            // console.log('[TreeView] Script execution starting, opening panel...');
            setIsScriptExecuting(true);
            showWithHighlight();
        };

        /**
         * When a command is about to execute
         */
        const handleExecuting = (event: Event) => {
            // 2026-07-05 decoupling: no longer force-opens the panel. When the tree
            // is already visible, the executing badge/highlight still render as before.
        };

        /**
         * When script execution ENDS (completed, error, or cancelled)
         */
        const handleExecutionEnd = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { status } = customEvent.detail || {};
            // console.log('[TreeView] Script execution ended:', status);
            setIsScriptExecuting(false);

            // Keep panel open after execution so user can see results
        };

        /**
         * Generic jjscript:executed event (from Jodie chat)
         */
        const handleJjScriptExecuted = () => {
            showWithHighlight();
        };

        /**
         * When metamodel is created/modified
         */
        const handleMetamodelCreated = () => {
            showWithHighlight();
        };

        /**
         * When a specific element is modified
         */
        const handleElementModified = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { elementId, parentId, command, action: eventAction } = customEvent.detail || {};

            if (!elementId) return;

            // When the tree is collapsed, don't force it open: just pulse the
            // collapsed toggle. No expand/highlight/scroll while not visible.
            if (!isVisible) {
                signalAttention();
                return;
            }

            const action = eventAction || (command ? getActionFromCommand(command) : 'unknown');
            // console.log(`[TreeView] Element modified: ${elementId} (${action})`);

            // Expand parent node to show the element
            if (parentId) {
                expandNode(parentId);
            }

            // Highlight the affected element
            highlightElement(elementId, action);

            // Scroll element into view
            window.dispatchEvent(new CustomEvent(SystemEvents.TREEVIEW_SCROLL, {
                detail: { elementId }
            }));
        };

        // Subscribe to events
        window.addEventListener(JjScriptEvents.EXECUTION_START, handleExecutionStart);
        window.addEventListener(JjScriptEvents.EXECUTING, handleExecuting);
        window.addEventListener(JjScriptEvents.EXECUTION_END, handleExecutionEnd);
        window.addEventListener(JjScriptEvents.EXECUTED, handleJjScriptExecuted);
        window.addEventListener(JjScriptEvents.METAMODEL_CREATED, handleMetamodelCreated);
        window.addEventListener(JjScriptEvents.ELEMENT_MODIFIED, handleElementModified);

        return () => {
            window.removeEventListener(JjScriptEvents.EXECUTION_START, handleExecutionStart);
            window.removeEventListener(JjScriptEvents.EXECUTING, handleExecuting);
            window.removeEventListener(JjScriptEvents.EXECUTION_END, handleExecutionEnd);
            window.removeEventListener(JjScriptEvents.EXECUTED, handleJjScriptExecuted);
            window.removeEventListener(JjScriptEvents.METAMODEL_CREATED, handleMetamodelCreated);
            window.removeEventListener(JjScriptEvents.ELEMENT_MODIFIED, handleElementModified);
        };
    }, [isVisible, showWithHighlight, expandNode, highlightElement, signalAttention]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            if (attentionTimeoutRef.current) {
                clearTimeout(attentionTimeoutRef.current);
            }
        };
    }, []);

    return (
        <TreeViewPanelContext.Provider value={{
            isVisible,
            show,
            hide,
            toggle,
            showWithHighlight,
            isHighlighted,
            isScriptExecuting,
            attentionPulse,
            // Element highlighting
            highlightedElementId,
            highlightedAction,
            highlightElement,
            clearHighlight,
            expandedNodeIds,
            expandNode,
            collapseNode,
            toggleNode,
            activeEditorType,
            setActiveEditorType,
            isInspectorVisible,
            showInspector,
            toggleInspector,
        }}>
            {children}
        </TreeViewPanelContext.Provider>
    );
};

export const useTreeViewPanel = (): TreeViewPanelContextType => {
    const context = useContext(TreeViewPanelContext);
    if (!context) {
        throw new Error('useTreeViewPanel must be used within TreeViewPanelProvider');
    }
    return context;
};

export default TreeViewPanelContext;
