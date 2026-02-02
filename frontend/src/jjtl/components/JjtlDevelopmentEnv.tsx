/**
 * JjtlDevelopmentEnv Component
 * Main container for the JjTL development environment
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    /** Callback when transformation is executed */
    onExecuteTransformation?: (sourceModelId: string, outputModelName: string) => Promise<void>;
}

type BottomPanelTab = 'problems' | 'trace' | 'inferred';
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

    // Side panel resize state
    const [sidePanelWidth, setSidePanelWidth] = useState(() => {
        const saved = localStorage.getItem('jjtl-sidebar-width');
        return saved ? parseInt(saved, 10) : 280;
    });
    const [isResizingSidePanel, setIsResizingSidePanel] = useState(false);
    const sidePanelRef = useRef<HTMLDivElement>(null);

    // Mappings state
    const [mappings, setMappings] = useState<MappingConnection[]>([]);
    const [selectedMapping, setSelectedMapping] = useState<string | undefined>();

    // Refs
    const editorRef = useRef<any>(null);

    // Parser hook
    const { ast, errors: parserErrors, isValid, parse } = useJjtlParser();

    // Executor hook
    const { execute, trace, isExecuting, executionStatus, lastExecutionTime } = useJjtlExecutor();

    // Convert parser errors to problems
    const problems: Problem[] = parserErrors.map((e, i) => parserErrorToProblem(e, i));

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
        if (isValid) {
            setIsExecuteDialogOpen(true);
        }
    }, [isValid]);

    // Handle actual transformation execution from dialog
    const handleExecuteTransformation = useCallback(async (sourceModelId: string, outputModelName: string) => {
        if (onExecuteTransformation) {
            await onExecuteTransformation(sourceModelId, outputModelName);
        }
        // Also execute the internal executor for tracing
        if (ast && sourceMetamodel.length > 0) {
            execute(ast, sourceMetamodel);
        }
        setIsExecuteDialogOpen(false);
    }, [ast, sourceMetamodel, execute, onExecuteTransformation]);

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

    // Handle suggestion accept - add to mappings
    const handleSuggestionAccept = useCallback((suggestion: MappingSuggestion) => {
        const newMapping: MappingConnection = {
            id: `mapping-${Date.now()}`,
            sourceElementId: suggestion.sourceAttribute
                ? `${suggestion.sourceClass}.${suggestion.sourceAttribute}`
                : suggestion.sourceClass,
            targetElementId: suggestion.targetAttribute
                ? `${suggestion.targetClass}.${suggestion.targetAttribute}`
                : suggestion.targetClass,
            mappingType: suggestion.sourceAttribute ? 'attribute' : 'class',
        };
        setMappings(prev => [...prev, newMapping]);
    }, []);

    // Handle accept all suggestions
    const handleSuggestionAcceptAll = useCallback((suggestions: MappingSuggestion[]) => {
        const newMappings: MappingConnection[] = suggestions.map(suggestion => ({
            id: `mapping-${Date.now()}-${suggestion.id}`,
            sourceElementId: suggestion.sourceAttribute
                ? `${suggestion.sourceClass}.${suggestion.sourceAttribute}`
                : suggestion.sourceClass,
            targetElementId: suggestion.targetAttribute
                ? `${suggestion.targetClass}.${suggestion.targetAttribute}`
                : suggestion.targetClass,
            mappingType: suggestion.sourceAttribute ? 'attribute' : 'class',
        }));
        setMappings(prev => [...prev, ...newMappings]);
    }, []);

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

    // Side panel resize logic
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;

            if (isMod && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            if (isMod && e.key === 'Enter') {
                e.preventDefault();
                handleExecuteClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleExecuteClick]);

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
                            mappings={mappings}
                            selectedMapping={selectedMapping}
                            onMappingSelect={(m) => setSelectedMapping(m.id)}
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
                        />
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
                <div className="jjtl-dev-env-editor">
                    <JjtlEditor
                        value={code}
                        onChange={handleCodeChange}
                        onParse={handleParse}
                        height="100%"
                    />
                </div>

                {/* Right panel - Suggested mappings (optional) */}
                {layoutMode === 'split-horizontal' && (
                    <div className="jjtl-dev-env-inferred-panel">
                        <SuggestedMappingsPanel
                            sourceMetamodel={sourceMetamodel}
                            targetMetamodel={targetMetamodel}
                            getSourceMetamodel={getSourceMetamodel}
                            getTargetMetamodel={getTargetMetamodel}
                            sourceMetamodelName={sourceMetamodelName}
                            targetMetamodelName={targetMetamodelName}
                            onAccept={handleSuggestionAccept}
                            onAcceptAll={handleSuggestionAcceptAll}
                            onInsertCode={handleInsertCode}
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
