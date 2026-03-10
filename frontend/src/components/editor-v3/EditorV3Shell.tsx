/**
 * Editor V3 — Shell (outermost component).
 *
 * Orchestrates: ReactFlowProvider + EditorV3Context + EditorV3Inner.
 * This is the public API component mounted by the application.
 *
 * Layout: AdaptivePalette | ReactFlow Canvas | PropertiesPanel
 *
 * Props:
 * - modelid: ID of the DModel to edit
 * - mode: 'metamodel' | 'model' (auto-detected if omitted)
 * - notation, colorScheme, theme: rendering preferences
 * - readOnly: disable editing
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ReactFlowProvider, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { EditorV3Context } from './contexts/EditorV3Context';
import { EditorV3Inner } from './EditorV3Inner';
import { NotationSelector } from './toolbar/NotationSelector';
import { AdaptivePalette } from './panels/AdaptivePalette';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { useEditorMode } from './hooks/useEditorMode';
import { useStandaloneMode } from './hooks/useStandaloneMode';
import type {
    EditorMode,
    NotationMode,
    ColorScheme,
    ThemeMode,
    EditorV3ContextType,
} from './types';
import { DEFAULT_GRID_SIZE } from './constants';
import './styles/editor-v3.scss';

export interface EditorV3ShellProps {
    modelid: string;
    mode?: EditorMode;
    viewpointId?: string;
    notation?: NotationMode;
    colorScheme?: ColorScheme;
    theme?: ThemeMode;
    readOnly?: boolean;
}

export function EditorV3Shell({
    modelid,
    mode: modeProp,
    viewpointId,
    notation: notationProp = 'uml',
    colorScheme: colorSchemeProp = 'default',
    theme: themeProp = 'light',
    readOnly = false,
}: EditorV3ShellProps) {
    // Standalone mode: auto-create model+graph when modelid is empty
    const standalone = useStandaloneMode(modelid);
    const effectiveModelId = standalone.modelId;

    const [graphId, setGraphId] = useState<string>('');
    const [snapToGrid, setSnapToGrid] = useState(false);

    // Live-switchable state (initialized from props)
    const [notation, setNotation] = useState<NotationMode>(notationProp);
    const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemeProp);
    const [theme, setTheme] = useState<ThemeMode>(themeProp);

    // Selection state (for properties panel)
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

    // Auto-detect mode (M2 vs M1) using model metadata
    const modeInfo = useEditorMode(effectiveModelId, modeProp);
    const mode: EditorMode = modeInfo.mode;

    // Placeholder callbacks (will be implemented in later phases)
    const takeSnapshot = useCallback(() => {
        // Phase 7: undo/redo
    }, []);

    const onAnchorRecalcNeeded = useCallback(() => {
        // Phase 3: edge anchor recalculation
    }, []);

    const onLayoutChanged = useCallback(() => {
        // Phase 4: layout change notification
    }, []);

    const contextValue: EditorV3ContextType = useMemo(() => ({
        mode,
        modelId: effectiveModelId,
        graphId,
        metamodelId: modeInfo.metamodelId,
        viewpointId: viewpointId ?? null,
        notation,
        colorScheme,
        theme,
        snapToGrid,
        gridSize: DEFAULT_GRID_SIZE,
        takeSnapshot,
        onAnchorRecalcNeeded,
        onLayoutChanged,
    }), [mode, effectiveModelId, graphId, modeInfo.metamodelId, viewpointId, notation, colorScheme, theme,
         snapToGrid, takeSnapshot, onAnchorRecalcNeeded, onLayoutChanged]);

    const handleSyncResult = useCallback((result: any) => {
        if (result.graphId && result.graphId !== graphId) {
            setGraphId(result.graphId);
        }
    }, [graphId]);

    const handleSelectionChange = useCallback((nodes: Node[], edges: Edge[]) => {
        setSelectedNodes(nodes);
        setSelectedEdges(edges);
    }, []);

    return (
        <div className={`editor-v3-shell v3-theme--${theme}`}>
            <EditorV3Context.Provider value={contextValue}>
                <div className="editor-v3-shell__toolbar">
                    <NotationSelector
                        notation={notation}
                        colorScheme={colorScheme}
                        theme={theme}
                        onNotationChange={setNotation}
                        onColorSchemeChange={setColorScheme}
                        onThemeChange={setTheme}
                    />
                </div>
                <div className="editor-v3-shell__layout">
                    {!readOnly && <AdaptivePalette />}
                    <div className="editor-v3-shell__canvas">
                        <ReactFlowProvider>
                            <EditorV3Inner
                                onSyncResult={handleSyncResult}
                                onSelectionChange={handleSelectionChange}
                            />
                        </ReactFlowProvider>
                    </div>
                    {!readOnly && (
                        <PropertiesPanel
                            selectedNodes={selectedNodes}
                            selectedEdges={selectedEdges}
                        />
                    )}
                </div>
            </EditorV3Context.Provider>
        </div>
    );
}

export default EditorV3Shell;
