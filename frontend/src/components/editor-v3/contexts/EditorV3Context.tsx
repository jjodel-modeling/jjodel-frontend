/**
 * Editor V3 — Main context.
 *
 * Provides editor-wide state (mode, notation, theme, etc.) to all child components.
 */

import { createContext, useContext } from 'react';
import type { EditorV3ContextType } from '../types';

export const EditorV3Context = createContext<EditorV3ContextType | null>(null);

/** Throws if used outside the provider — for components that require the context. */
export function useEditorV3Context(): EditorV3ContextType {
    const context = useContext(EditorV3Context);
    if (!context) {
        throw new Error('useEditorV3Context must be used within EditorV3Context.Provider');
    }
    return context;
}

/** Returns null if used outside the provider — for optional consumers. */
export function useEditorV3ContextSafe(): EditorV3ContextType | null {
    return useContext(EditorV3Context);
}
