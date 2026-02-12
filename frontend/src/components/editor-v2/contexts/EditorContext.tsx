import { createContext, useContext } from 'react';

interface EditorContextValue {
    takeSnapshot: () => void;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditorContext must be used within EditorContext.Provider');
    }
    return context;
}

export function useEditorContextSafe() {
    return useContext(EditorContext);
}
