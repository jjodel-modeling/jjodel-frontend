import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { windoww } from '../../joiner';
import { JjodelEvents } from '../../events/registry';

export type EditorId = 'flow' | 'classic';

export interface ZoomController {
    getZoom: () => number;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom?: () => void;
    setZoom?: (value: number) => void;
}

export interface ActiveEditorAPI {
    activeEditorId: EditorId | null;
    setActive: (id: EditorId) => void;
    registerZoomController: (id: EditorId, controller: ZoomController) => void;
    unregisterZoomController: (id: EditorId) => void;
    getActiveZoomController: () => ZoomController | null;
}

const ActiveEditorContext = createContext<ActiveEditorAPI | null>(null);

export const ActiveEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeEditorId, setActiveEditorId] = useState<EditorId | null>(null);
    const controllersRef = useRef<Map<EditorId, ZoomController>>(new Map());

    const setActive = useCallback((id: EditorId) => {
        setActiveEditorId((prev) => (prev === id ? prev : id));
    }, []);

    const registerZoomController = useCallback((id: EditorId, controller: ZoomController) => {
        controllersRef.current.set(id, controller);
        setActiveEditorId((prev) => prev ?? id);
    }, []);

    const unregisterZoomController = useCallback((id: EditorId) => {
        controllersRef.current.delete(id);
        setActiveEditorId((prev) => (prev === id ? null : prev));
    }, []);

    const getActiveZoomController = useCallback((): ZoomController | null => {
        if (!activeEditorId) return null;
        return controllersRef.current.get(activeEditorId) ?? null;
    }, [activeEditorId]);

    const value = useMemo<ActiveEditorAPI>(
        () => ({
            activeEditorId,
            setActive,
            registerZoomController,
            unregisterZoomController,
            getActiveZoomController,
        }),
        [activeEditorId, setActive, registerZoomController, unregisterZoomController, getActiveZoomController]
    );

    return <ActiveEditorContext.Provider value={value}>{children}</ActiveEditorContext.Provider>;
};

export function useActiveEditor(): ActiveEditorAPI {
    const ctx = useContext(ActiveEditorContext);
    if (!ctx) throw new Error('useActiveEditor must be used within an ActiveEditorProvider');
    return ctx;
}

export function useActiveEditorOptional(): ActiveEditorAPI | null {
    return useContext(ActiveEditorContext);
}

export const CLASSIC_ZOOM_MIN = 0.1;
export const CLASSIC_ZOOM_MAX = 5.0;

// Hook-free bridge: emits a CustomEvent during render so that EditorV2Inner
// (which lives in the real React tree where hooks work) can register the
// classic editor's ZoomController. The bridge cannot use hooks itself
// because it is rendered from inside a Jjodel jsxString template, where
// the rendering path does not support React hooks (see commit history).
export const ClassicZoomBridge: React.FC<{ node: any }> = ({ node }) => {
    if (node && typeof window !== 'undefined') {
        // Fire synchronously during render. EditorV2Inner debounces by
        // comparing the node identity, so re-renders of this component
        // do not cause repeated registrations.
        window.dispatchEvent(new CustomEvent(JjodelEvents.CLASSIC_NODE_MOUNTED, {
            detail: { node },
        }));
    }
    return null;
};

// View templates in DV.tsx evaluate JSX strings via `new Function(...)`. Tag
// identifiers are resolved against the global scope (see ExecuteOnRead.ts,
// where joiner/components exports are auto-registered onto windoww). Since
// ClassicZoomBridge is not re-exported from joiner/components, we register it
// here so `<ClassicZoomBridge node={node}/>` resolves at render time.
(ClassicZoomBridge as any).cname = 'ClassicZoomBridge';
windoww['ClassicZoomBridge'] = ClassicZoomBridge;
