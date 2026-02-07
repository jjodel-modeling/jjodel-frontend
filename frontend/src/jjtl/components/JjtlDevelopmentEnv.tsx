/**
 * JjtlDevelopmentEnv Component
 * Main container for the JjTL development environment
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { JjtlToolbar } from './JjtlToolbar';
import { JjtlStatusBar } from './JjtlStatusBar';
import { JjtlEditor } from '../editor';
import { DualMetamodelPanel, MappingConnection } from '../views/DualMetamodelPanel';
import { MetamodelElement } from '../views/MetamodelTreeView';
import { ProblemsPanel, Problem, parserErrorToProblem } from '../views/ProblemsPanel';
import { MappingTraceView, TraceEntry } from '../views/MappingTraceView';
import { SuggestedMappingsPanel } from '../views/SuggestedMappingsPanel';
import { MappingSuggestion } from '../types/suggestions';
import { useJjtlParser } from '../hooks/useJjtlParser';
import { useJjtlExecutor } from '../hooks/useJjtlExecutor';
import { ParserError } from '../types';
import { ExecuteTransformationDialog, ModelOption } from './ExecuteTransformationDialog';

// Import JjTL styles
import '../styles/jjtl.scss';
import { getGrammarRuleAtPosition } from '../utils/astToGrammar';
import type { GrammarRule } from '../components/GrammarDiagram/types';

export interface JjtlDevelopmentEnvProps {
    initialCode?: string;
    /** Static source metamodel data */
    sourceMetamodel?: MetamodelElement[];
    /** Static target metamodel data */
    targetMetamodel?: MetamodelElement[];
    /** Getter function to fetch fresh source metamodel data (for Suggested Mappings) */
    getSourceMetamodel?: () => MetamodelElement[];
    /** Getter function to fetch fresh target metamodel data (for Suggested Mappings) */
    getTargetMetamodel?: () => MetamodelElement[];
    sourceMetamodelName?: string;
    targetMetamodelName?: string;
    /** Available models for transformation execution */
    availableModels?: ModelOption[];
    /** Existing model names (to prevent duplicates) */
    existingModelNames?: string[];
    onSave?: (code: string) => void;
    onCodeChange?: (code: string) => void;
    /** Callback when transformation is executed - receives AST for execution by parent */
    onExecuteTransformation?: (
        sourceModelId: string,
        outputModelName: string,
        ast: import('../types').TransformationAST
    ) => Promise<void>;
}

type BottomPanelTab = 'problems' | 'trace' | 'output';
type LayoutMode = 'editor-only' | 'split-horizontal' | 'split-vertical';

const DEFAULT_CODE = `transformation NewTransformation

from SourceMetamodel
to   TargetMetamodel

# Define your mappings here
# SourceClass -> TargetClass {
#     sourceAttr -> targetAttr
# }
`;

export const JjtlDevelopmentEnv: React.FC<JjtlDevelopmentEnvProps> = ({
    initialCode = DEFAULT_CODE,
    sourceMetamodel = [],
    targetMetamodel = [],
    getSourceMetamodel,
    getTargetMetamodel,
    sourceMetamodelName = 'Source',
    targetMetamodelName = 'Target',
    availableModels = [],
    existingModelNames = [],
    onSave,
    onCodeChange,
    onExecuteTransformation,
}) => {
    // State
    const [code, setCode] = useState(initialCode);
    const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('split-horizontal');
    const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('problems');
    const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
    const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

    // Output messages for the Output tab
    const [outputMessages, setOutputMessages] = useState<string[]>([]);

    // Editor action buttons state
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    // Left side panel resize state
    const [sidePanelWidth, setSidePanelWidth] = useState(() => {
        const saved = localStorage.getItem('jjtl-sidebar-width');
        return saved ? parseInt(saved, 10) : 280;
    });
    const [isResizingSidePanel, setIsResizingSidePanel] = useState(false);
    const sidePanelRef = useRef<HTMLDivElement>(null);

    // Right panel (Suggested Mappings) resize state
    const [rightPanelWidth, setRightPanelWidth] = useState(() => {
        const saved = localStorage.getItem('jjtl-right-panel-width');
        return saved ? parseInt(saved, 10) : 400; // Larger default: 400px
    });
    const [isResizingRightPanel, setIsResizingRightPanel] = useState(false);
    const rightPanelRef = useRef<HTMLDivElement>(null);

    // Mappings state
    const [mappings, setMappings] = useState<MappingConnection[]>([]);
    const [selectedMapping, setSelectedMapping] = useState<string | undefined>();

    // Suggestions state - for arrow visualization in DualMetamodelPanel
    const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
    const [hoveredSuggestion, setHoveredSuggestion] = useState<string | null>(null);

    // Grammar sync state - highlighted rule based on cursor position
    const [highlightedGrammarRule, setHighlightedGrammarRule] = useState<GrammarRule | null>(null);

    // Refs
    const editorRef = useRef<any>(null);

    // Parser hook - includes parseNow for immediate parsing with result
    const { ast, errors: parserErrors, isValid, parse, parseNow } = useJjtlParser();

    // Ref to track latest AST (avoids stale closure issues)
    const astRef = useRef(ast);
    useEffect(() => {
        astRef.current = ast;
        console.log('[JjtlDevelopmentEnv] AST updated in ref:', {
            hasAst: !!ast,
            mappingsCount: ast?.mappings?.length || 0
        });
    }, [ast]);

    // Executor hook
    const { execute, trace, isExecuting, executionStatus, lastExecutionTime } = useJjtlExecutor();

    // Convert parser errors to problems
    const problems: Problem[] = parserErrors.map((e, i) => parserErrorToProblem(e, i));

    // Parse initial code on mount to ensure AST is populated
    useEffect(() => {
        if (initialCode) {
            console.log('[JjtlDevelopmentEnv] Initial parse on mount, code length:', initialCode.length);
            parseNow(initialCode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount - parseNow is stable

    // Re-parse when initialCode prop changes (component receives new transformation)
    useEffect(() => {
        if (initialCode && initialCode !== code) {
            console.log('[JjtlDevelopmentEnv] initialCode prop changed, re-parsing');
            setCode(initialCode);
            parseNow(initialCode);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]); // Only react to initialCode changes

    // Handle code change
    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode);
        setHasUnsavedChanges(true);
        onCodeChange?.(newCode);
        parse(newCode);
    }, [onCodeChange, parse]);

    // Handle parse result
    const handleParse = useCallback(({ errors }: { errors: ParserError[] }) => {
        // Errors are already handled by useJjtlParser
    }, []);

    // Handle save
    const handleSave = useCallback(() => {
        onSave?.(code);
        setHasUnsavedChanges(false);
    }, [code, onSave]);

    // Handle execute button click - opens the dialog
    const handleExecuteClick = useCallback(() => {
        console.log('[JjtlDevelopmentEnv] handleExecuteClick called, isValid:', isValid);
        if (isValid) {
            console.log('[JjtlDevelopmentEnv] Opening ExecuteTransformationDialog...');
            setIsExecuteDialogOpen(true);
        } else {
            console.log('[JjtlDevelopmentEnv] Cannot execute: transformation is not valid');
        }
    }, [isValid]);

    // Handle copy code to clipboard
    const handleCopyCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    }, [code]);

    // Handle fullscreen toggle
    const handleToggleFullscreen = useCallback(() => {
        setIsEditorFullscreen(prev => !prev);
    }, []);

    // Handle validate - triggers parsing and shows problems
    const handleValidate = useCallback(() => {
        parse(code);
        setBottomPanelTab('problems');
        setIsBottomPanelCollapsed(false);
    }, [code, parse]);

    // Handle cursor position change - update grammar sync
    const handleCursorPositionChange = useCallback((position: { line: number; column: number }) => {
        setCursorPosition(position);

        // Update highlighted grammar rule based on cursor position
        const rule = getGrammarRuleAtPosition(ast, position.line, position.column);
        setHighlightedGrammarRule(rule);
    }, [ast]);

    // Helper per aggiungere messaggi all'output
    const addOutputMessage = useCallback((message: string) => {
        setOutputMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    }, []);

    // Helper per pulire l'output
    const clearOutput = useCallback(() => {
        setOutputMessages([]);
    }, []);

    // Handle actual transformation execution from dialog
    const handleExecuteTransformation = useCallback(async (sourceModelId: string, outputModelName: string) => {
        // Clear previous output and start logging
        clearOutput();
        addOutputMessage('Starting transformation execution...');
        addOutputMessage(`Source model: ${sourceModelId}`);
        addOutputMessage(`Output model: ${outputModelName}`);

        console.log('[JjtlDevelopmentEnv] handleExecuteTransformation called');
        console.log('[JjtlDevelopmentEnv] sourceModelId:', sourceModelId);
        console.log('[JjtlDevelopmentEnv] outputModelName:', outputModelName);

        // Get fresh AST by parsing the current code (avoids stale closure)
        // First try the ref, if it has mappings use it; otherwise re-parse
        let currentAst = astRef.current;
        console.log('[JjtlDevelopmentEnv] AST from ref:', {
            hasAst: !!currentAst,
            mappingsCount: currentAst?.mappings?.length || 0
        });

        // If AST is stale (no mappings), force a fresh parse
        if (!currentAst || !currentAst.mappings || currentAst.mappings.length === 0) {
            console.log('[JjtlDevelopmentEnv] AST appears stale, forcing re-parse of current code');
            addOutputMessage('Re-parsing transformation code...');
            const freshResult = parseNow(code);
            currentAst = freshResult.ast;
            console.log('[JjtlDevelopmentEnv] Fresh parse result:', {
                hasAst: !!currentAst,
                mappingsCount: currentAst?.mappings?.length || 0,
                errorsCount: freshResult.errors.length
            });
        }

        if (!currentAst) {
            console.error('[JjtlDevelopmentEnv] Cannot execute: AST is null after re-parse');
            addOutputMessage('Error: Failed to parse transformation code');
            return;
        }

        if (!currentAst.mappings || currentAst.mappings.length === 0) {
            console.warn('[JjtlDevelopmentEnv] No mappings in AST');
            addOutputMessage('Warning: No mappings defined in transformation');
        }

        try {
            if (onExecuteTransformation) {
                addOutputMessage(`Processing ${currentAst.mappings?.length || 0} mappings...`);
                await onExecuteTransformation(sourceModelId, outputModelName, currentAst);
                addOutputMessage('Transformation completed successfully.');
            }

            // Also execute the internal executor for tracing
            if (currentAst && sourceMetamodel.length > 0) {
                const sourceMetamodelCopy = JSON.parse(JSON.stringify(sourceMetamodel));
                execute(currentAst, sourceMetamodelCopy);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addOutputMessage(`Error: ${errorMessage}`);
        }

        setIsExecuteDialogOpen(false);

        // Switch to output tab to show results
        setBottomPanelTab('output');
        setIsBottomPanelCollapsed(false);
    }, [code, sourceMetamodel, execute, onExecuteTransformation, clearOutput, addOutputMessage, parseNow]);

    // Handle problem click - navigate to error location
    const handleProblemClick = useCallback((problem: Problem) => {
        editorRef.current?.revealLineInCenter(problem.line);
        editorRef.current?.setPosition({ lineNumber: problem.line, column: problem.column });
    }, []);

    // Handle mapping creation from dual panel
    const handleMappingCreate = useCallback((sourceId: string, targetId: string) => {
        const newMapping: MappingConnection = {
            id: `mapping-${Date.now()}`,
            sourceElementId: sourceId,
            targetElementId: targetId,
            mappingType: 'class',
        };
        setMappings(prev => [...prev, newMapping]);
    }, []);

    // Handle mapping deletion
    const handleMappingDelete = useCallback((mappingId: string) => {
        setMappings(prev => prev.filter(m => m.id !== mappingId));
    }, []);

    // Handle suggestions update from SuggestedMappingsPanel
    const handleSuggestionsChange = useCallback((newSuggestions: MappingSuggestion[]) => {
        setSuggestions(newSuggestions);
    }, []);

    // Handle suggestion hover (bidirectional: cards ↔ arrows)
    const handleSuggestionHover = useCallback((suggestionId: string | null) => {
        setHoveredSuggestion(suggestionId);
    }, []);

    // Convert suggestions to MappingConnections for DualMetamodelPanel visualization
    const suggestionMappings: MappingConnection[] = useMemo(() => {
        // Only include non-rejected suggestions
        const result = suggestions
            .filter(s => s.status !== 'rejected')
            .map(suggestion => ({
                id: suggestion.id,
                sourceElementId: suggestion.sourceAttributeId || suggestion.sourceClassId,
                targetElementId: suggestion.targetAttributeId || suggestion.targetClassId,
                mappingType: (suggestion.sourceAttribute ? 'attribute' : 'class') as 'class' | 'attribute' | 'reference',
                status: suggestion.status,
            }));
        console.log('[JjtlDevelopmentEnv] Suggestions:', suggestions.length, suggestions.map(s => ({ id: s.id, status: s.status })));
        console.log('[JjtlDevelopmentEnv] SuggestionMappings:', result.length, result.map(m => ({ id: m.id, status: m.status })));
        return result;
    }, [suggestions]);

    // Combine regular mappings with suggestion mappings
    const allMappings = useMemo(() => {
        return [...mappings, ...suggestionMappings];
    }, [mappings, suggestionMappings]);

    // Handle insert generated JjTL code from suggestions
    const handleInsertCode = useCallback((generatedCode: string) => {
        console.log('[JjtlDevelopmentEnv] Inserting generated code:', generatedCode);

        // Find the header section (transformation ... from ... to ...)
        // and append the generated mappings after it
        // Using [\s\S] instead of . with 's' flag for multiline matching
        const headerPattern = /^(transformation\s+\S+[\s\S]*?\n\s*\nfrom\s+\S+\s*\nto\s+\S+\s*\n)/;
        const headerMatch = code.match(headerPattern);

        if (headerMatch) {
            // Append after header, replacing any existing content after it
            const header = headerMatch[1];
            const newCode = header + '\n' + generatedCode;
            setCode(newCode);
            setHasUnsavedChanges(true);
            onCodeChange?.(newCode);
            parse(newCode);
        } else {
            // No header found, just append to the end
            const newCode = code.trim() + '\n\n' + generatedCode;
            setCode(newCode);
            setHasUnsavedChanges(true);
            onCodeChange?.(newCode);
            parse(newCode);
        }
    }, [code, onCodeChange, parse]);

    // Left side panel resize logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingSidePanel || !sidePanelRef.current) return;

            const newWidth = e.clientX - sidePanelRef.current.getBoundingClientRect().left;
            const clampedWidth = Math.max(200, Math.min(800, newWidth));
            setSidePanelWidth(clampedWidth);
            localStorage.setItem('jjtl-sidebar-width', String(clampedWidth));
        };

        const handleMouseUp = () => {
            setIsResizingSidePanel(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizingSidePanel) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingSidePanel]);

    // Right panel (Suggested Mappings) resize logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRightPanel || !rightPanelRef.current) return;

            // For right panel: width = right edge of panel - mouse X
            const panelRect = rightPanelRef.current.getBoundingClientRect();
            const newWidth = panelRect.right - e.clientX;
            const clampedWidth = Math.max(300, Math.min(600, newWidth));
            setRightPanelWidth(clampedWidth);
            localStorage.setItem('jjtl-right-panel-width', String(clampedWidth));
        };

        const handleMouseUp = () => {
            setIsResizingRightPanel(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizingRightPanel) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingRightPanel]);

    // Nascondi pannello destro globale quando JjTL è attivo
    // Usando manipolazione diretta del layout rc-dock (più affidabile del CSS)
    useEffect(() => {
        // Import DockManager dynamically to avoid circular dependencies
        import('../../components/abstract/DockManager').then(({ default: DockManager }) => {
            let originalRightPanelSize: number | null = null;

            // Nascondi pannello destro al mount
            const hideRightPanel = () => {
                if (!DockManager.dock) return;

                try {
                    const layout = DockManager.dock.getLayout();
                    if (layout?.dockbox?.children?.length >= 2) {
                        // Salva dimensione originale
                        originalRightPanelSize = layout.dockbox.children[1].size as number;

                        // Crea copia del layout e imposta dimensione a 0
                        const updatedLayout = JSON.parse(JSON.stringify(layout));
                        updatedLayout.dockbox.children[1].size = 0;
                        updatedLayout.dockbox.children[0].size = window.innerWidth;

                        DockManager.dock.loadLayout(updatedLayout);
                        console.log('[JjTL] Right panel hidden, original size:', originalRightPanelSize);

                        // Trigger resize per ricalcolare
                        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                    }
                } catch (error) {
                    console.error('[JjTL] Error hiding right panel:', error);
                }
            };

            // Piccolo delay per assicurarsi che il dock sia pronto
            const timer = setTimeout(hideRightPanel, 100);

            // Store cleanup info in ref for access in cleanup
            (window as any).__jjtl_original_size = originalRightPanelSize;
            (window as any).__jjtl_hide_timer = timer;
        });

        // Cleanup: ripristina pannello destro al unmount
        return () => {
            // Clear any pending timer
            if ((window as any).__jjtl_hide_timer) {
                clearTimeout((window as any).__jjtl_hide_timer);
            }

            import('../../components/abstract/DockManager').then(({ default: DockManager }) => {
                if (!DockManager.dock) return;

                try {
                    const layout = DockManager.dock.getLayout();
                    if (layout?.dockbox?.children?.length >= 2) {
                        // Usa dimensione salvata o default
                        const rightSize = (window as any).__jjtl_original_size || 400;

                        const updatedLayout = JSON.parse(JSON.stringify(layout));
                        updatedLayout.dockbox.children[1].size = rightSize;
                        updatedLayout.dockbox.children[0].size = window.innerWidth - rightSize;

                        DockManager.dock.loadLayout(updatedLayout);
                        console.log('[JjTL] Right panel restored, size:', rightSize);

                        // Trigger resize per ricalcolare
                        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                    }
                } catch (error) {
                    console.error('[JjTL] Error showing right panel:', error);
                }

                // Cleanup window properties
                delete (window as any).__jjtl_original_size;
                delete (window as any).__jjtl_hide_timer;
            });
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;

            // Ctrl+S → Save
            if (isMod && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            // Ctrl+Enter → Execute
            if (isMod && e.key === 'Enter') {
                e.preventDefault();
                if (isValid && !isExecuting) {
                    handleExecuteClick();
                }
            }
            // Ctrl+Shift+V → Validate
            if (isMod && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                handleValidate();
            }
            // F11 → Fullscreen toggle
            if (e.key === 'F11') {
                e.preventDefault();
                handleToggleFullscreen();
            }
            // Esc → Exit fullscreen
            if (e.key === 'Escape' && isEditorFullscreen) {
                setIsEditorFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleExecuteClick, handleValidate, handleToggleFullscreen, isValid, isExecuting, isEditorFullscreen]);

    // Parser status
    const parserStatus = parserErrors.length > 0 ? 'error' : isValid ? 'valid' : 'idle';

    return (
        <div className="jjtl-dev-env">
            {/* Toolbar */}
            <JjtlToolbar
                transformationName={ast?.name || 'Untitled'}
                sourceMetamodel={sourceMetamodelName}
                targetMetamodel={targetMetamodelName}
                hasUnsavedChanges={hasUnsavedChanges}
                canExecute={isValid}
                isExecuting={isExecuting}
                onSave={handleSave}
                onExecute={handleExecuteClick}
            />

            {/* Main content area */}
            <div className={`jjtl-dev-env-content jjtl-layout--${layoutMode}`}>
                {/* Left panel - Dual metamodel view (optional) */}
                {layoutMode !== 'editor-only' && !isSidePanelCollapsed && (
                    <div
                        ref={sidePanelRef}
                        className={`jjtl-dev-env-side-panel ${isResizingSidePanel ? 'resizing' : ''}`}
                        style={{ width: sidePanelWidth }}
                    >
                        <div className="jjtl-dev-env-side-header">
                            <span>Metamodels</span>
                            <button onClick={() => setIsSidePanelCollapsed(true)}>
                                <i className="bi bi-chevron-left" />
                            </button>
                        </div>
                        <DualMetamodelPanel
                            sourceMetamodel={sourceMetamodel}
                            targetMetamodel={targetMetamodel}
                            sourceMetamodelName={sourceMetamodelName}
                            targetMetamodelName={targetMetamodelName}
                            mappings={allMappings}
                            selectedMapping={selectedMapping}
                            hoveredMapping={hoveredSuggestion}
                            onMappingSelect={(m) => setSelectedMapping(m.id)}
                            onMappingHover={handleSuggestionHover}
                            onMappingCreate={handleMappingCreate}
                            onMappingDelete={handleMappingDelete}
                        />
                        {/* Resize handle */}
                        <div
                            className="jjtl-side-panel-resize-handle"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizingSidePanel(true);
                            }}
                            role="separator"
                            aria-orientation="vertical"
                            tabIndex={0}
                            title="Drag to resize"
                        >
                            <i className={`bi bi-grip-vertical resize-grip-icon-vertical ${isResizingSidePanel ? 'dragging' : ''}`} />
                        </div>
                    </div>
                )}

                {/* Collapsed side panel toggle */}
                {isSidePanelCollapsed && (
                    <button
                        className="jjtl-dev-env-side-toggle"
                        onClick={() => setIsSidePanelCollapsed(false)}
                    >
                        <i className="bi bi-chevron-right" />
                    </button>
                )}

                {/* Center - Editor */}
                <div className={`jjtl-dev-env-editor ${isEditorFullscreen ? 'fullscreen' : ''}`}>
                    {/* Editor action buttons - top right corner */}
                    <div className="jjtl-editor-actions">
                        {/* Copy button */}
                        <button
                            className={`jjtl-editor-action-btn ${copyStatus === 'copied' ? 'copied' : ''}`}
                            onClick={handleCopyCode}
                            title={copyStatus === 'copied' ? 'Copied!' : 'Copy code'}
                        >
                            <i className={`bi ${copyStatus === 'copied' ? 'bi-check-lg' : 'bi-clipboard'}`} />
                        </button>

                        {/* Fullscreen button */}
                        <button
                            className="jjtl-editor-action-btn"
                            onClick={handleToggleFullscreen}
                            title={isEditorFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F11)'}
                        >
                            <i className={`bi ${isEditorFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} />
                        </button>

                        {/* Divider */}
                        <div className="jjtl-editor-action-divider" />

                        {/* Validate button */}
                        <button
                            className="jjtl-editor-action-btn"
                            onClick={handleValidate}
                            disabled={!code.trim()}
                            title="Validate (Ctrl+Shift+V)"
                        >
                            <i className="bi bi-check2-circle" />
                        </button>

                        {/* Execute button */}
                        <button
                            className="jjtl-editor-action-btn jjtl-editor-action-btn--primary"
                            onClick={handleExecuteClick}
                            disabled={!isValid || isExecuting}
                            title="Execute transformation (Ctrl+Enter)"
                        >
                            <i className={`bi ${isExecuting ? 'bi-hourglass-split' : 'bi-play-fill'}`} />
                        </button>
                    </div>

                    {/* Fullscreen overlay header */}
                    {isEditorFullscreen && (
                        <div className="jjtl-fullscreen-header">
                            <span className="jjtl-fullscreen-title">
                                <i className="bi bi-arrow-left-right" />
                                {ast?.name || 'Transformation'}
                            </span>
                            <button
                                className="jjtl-fullscreen-close"
                                onClick={handleToggleFullscreen}
                                title="Exit fullscreen (Esc)"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    )}

                    {/* Monaco Editor */}
                    <JjtlEditor
                        value={code}
                        onChange={handleCodeChange}
                        onParse={handleParse}
                        onCursorPositionChange={handleCursorPositionChange}
                        height="100%"
                    />
                </div>

                {/* Right panel - Suggested Mappings ONLY */}
                {layoutMode === 'split-horizontal' && (
                    <div
                        ref={rightPanelRef}
                        className={`jjtl-dev-env-inferred-panel ${isResizingRightPanel ? 'resizing' : ''}`}
                        style={{ width: rightPanelWidth }}
                    >
                        {/* Resize handle on left edge */}
                        <div
                            className="jjtl-right-panel-resize-handle"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizingRightPanel(true);
                            }}
                            role="separator"
                            aria-orientation="vertical"
                            tabIndex={0}
                            title="Drag to resize"
                        >
                            <i className={`bi bi-grip-vertical resize-grip-icon-vertical ${isResizingRightPanel ? 'dragging' : ''}`} />
                        </div>

                        {/* Suggested Mappings - unico contenuto */}
                        <SuggestedMappingsPanel
                            sourceMetamodel={sourceMetamodel}
                            targetMetamodel={targetMetamodel}
                            getSourceMetamodel={getSourceMetamodel}
                            getTargetMetamodel={getTargetMetamodel}
                            sourceMetamodelName={sourceMetamodelName}
                            targetMetamodelName={targetMetamodelName}
                            hoveredMapping={hoveredSuggestion}
                            onMappingHover={handleSuggestionHover}
                            onSuggestionsChange={handleSuggestionsChange}
                            onInsertCode={handleInsertCode}
                            highlightedGrammarRule={highlightedGrammarRule}
                        />
                    </div>
                )}
            </div>

            {/* Bottom panel */}
            <div className={`jjtl-dev-env-bottom ${isBottomPanelCollapsed ? 'collapsed' : ''}`}>
                {/* Tab bar */}
                <div className="jjtl-dev-env-bottom-tabs">
                    <button
                        className={`jjtl-dev-env-bottom-tab ${bottomPanelTab === 'problems' ? 'active' : ''}`}
                        onClick={() => { setBottomPanelTab('problems'); setIsBottomPanelCollapsed(false); }}
                    >
                        <i className="bi bi-exclamation-circle" />
                        Problems
                        {problems.length > 0 && (
                            <span className="jjtl-dev-env-bottom-badge">{problems.length}</span>
                        )}
                    </button>
                    <button
                        className={`jjtl-dev-env-bottom-tab ${bottomPanelTab === 'trace' ? 'active' : ''}`}
                        onClick={() => { setBottomPanelTab('trace'); setIsBottomPanelCollapsed(false); }}
                    >
                        <i className="bi bi-diagram-2" />
                        Trace
                        {trace.length > 0 && (
                            <span className="jjtl-dev-env-bottom-badge">{trace.length}</span>
                        )}
                    </button>
                    <button
                        className={`jjtl-dev-env-bottom-tab ${bottomPanelTab === 'output' ? 'active' : ''}`}
                        onClick={() => { setBottomPanelTab('output'); setIsBottomPanelCollapsed(false); }}
                    >
                        <i className="bi bi-terminal" />
                        Output
                        {outputMessages.length > 0 && (
                            <span className="jjtl-dev-env-bottom-badge">{outputMessages.length}</span>
                        )}
                    </button>
                    <div className="jjtl-dev-env-bottom-spacer" />

                    {/* Layout toggle */}
                    <div className="jjtl-dev-env-layout-toggle">
                        <button
                            className={layoutMode === 'editor-only' ? 'active' : ''}
                            onClick={() => setLayoutMode('editor-only')}
                            title="Editor only"
                        >
                            <i className="bi bi-square" />
                        </button>
                        <button
                            className={layoutMode === 'split-horizontal' ? 'active' : ''}
                            onClick={() => setLayoutMode('split-horizontal')}
                            title="Split horizontal"
                        >
                            <i className="bi bi-layout-split" />
                        </button>
                        <button
                            className={layoutMode === 'split-vertical' ? 'active' : ''}
                            onClick={() => setLayoutMode('split-vertical')}
                            title="Split vertical"
                        >
                            <i className="bi bi-layout-sidebar" />
                        </button>
                    </div>

                    <button
                        className="jjtl-dev-env-bottom-collapse"
                        onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
                    >
                        <i className={`bi ${isBottomPanelCollapsed ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                    </button>
                </div>

                {/* Panel content */}
                {!isBottomPanelCollapsed && (
                    <div className="jjtl-dev-env-bottom-content">
                        {bottomPanelTab === 'problems' && (
                            <ProblemsPanel
                                problems={problems}
                                onProblemClick={handleProblemClick}
                            />
                        )}
                        {bottomPanelTab === 'trace' && (
                            <MappingTraceView trace={trace} />
                        )}
                        {bottomPanelTab === 'output' && (
                            <div className="jjtl-output-panel">
                                {outputMessages.length === 0 ? (
                                    <div className="jjtl-output-empty">
                                        <i className="bi bi-terminal" />
                                        <span>No output yet. Execute transformation to see results.</span>
                                    </div>
                                ) : (
                                    <div className="jjtl-output-messages">
                                        {outputMessages.map((msg, idx) => (
                                            <div key={idx} className="jjtl-output-line">
                                                {msg}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status bar */}
            <JjtlStatusBar
                parserStatus={parserStatus}
                errorCount={parserErrors.length}
                warningCount={0}
                cursorLine={cursorPosition.line}
                cursorColumn={cursorPosition.column}
                executionStatus={executionStatus}
                lastExecutionTime={lastExecutionTime}
                mappedElementsCount={trace.filter(t => t.status === 'success').length}
                onErrorsClick={() => { setBottomPanelTab('problems'); setIsBottomPanelCollapsed(false); }}
            />

            {/* Execute Transformation Dialog */}
            <ExecuteTransformationDialog
                isOpen={isExecuteDialogOpen}
                onClose={() => setIsExecuteDialogOpen(false)}
                onExecute={handleExecuteTransformation}
                transformationName={ast?.name || 'Untitled'}
                sourceMetamodelName={sourceMetamodelName}
                targetMetamodelName={targetMetamodelName}
                availableModels={availableModels}
                existingModelNames={existingModelNames}
            />
        </div>
    );
};

export default JjtlDevelopmentEnv;
