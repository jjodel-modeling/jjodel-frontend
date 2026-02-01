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
import { InferredMappingsPanel, InferredMapping } from '../views/InferredMappingsPanel';
import { useJjtlParser } from '../hooks/useJjtlParser';
import { useJjtlExecutor } from '../hooks/useJjtlExecutor';
import { ParserError } from '../types';

export interface JjtlDevelopmentEnvProps {
    initialCode?: string;
    sourceMetamodel?: MetamodelElement[];
    targetMetamodel?: MetamodelElement[];
    sourceMetamodelName?: string;
    targetMetamodelName?: string;
    onSave?: (code: string) => void;
    onCodeChange?: (code: string) => void;
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
    sourceMetamodelName = 'Source',
    targetMetamodelName = 'Target',
    onSave,
    onCodeChange,
}) => {
    // State
    const [code, setCode] = useState(initialCode);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('split-horizontal');
    const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('problems');
    const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
    const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

    // Mappings state
    const [mappings, setMappings] = useState<MappingConnection[]>([]);
    const [selectedMapping, setSelectedMapping] = useState<string | undefined>();

    // Inferred mappings
    const [inferredMappings, setInferredMappings] = useState<InferredMapping[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    // Handle execute
    const handleExecute = useCallback(() => {
        if (ast && sourceMetamodel.length > 0) {
            execute(ast, sourceMetamodel);
        }
    }, [ast, sourceMetamodel, execute]);

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

    // Handle inferred mapping accept
    const handleAcceptInferred = useCallback((mapping: InferredMapping) => {
        const newMapping: MappingConnection = {
            id: `mapping-${Date.now()}`,
            sourceElementId: mapping.sourceClass,
            targetElementId: mapping.targetClass,
            mappingType: mapping.mappingType,
        };
        setMappings(prev => [...prev, newMapping]);
        setInferredMappings(prev => prev.filter(m => m.id !== mapping.id));
    }, []);

    // Handle accept all inferred
    const handleAcceptAllInferred = useCallback((mappingsToAccept: InferredMapping[]) => {
        const newMappings: MappingConnection[] = mappingsToAccept.map(m => ({
            id: `mapping-${Date.now()}-${m.id}`,
            sourceElementId: m.sourceClass,
            targetElementId: m.targetClass,
            mappingType: m.mappingType,
        }));
        setMappings(prev => [...prev, ...newMappings]);
        setInferredMappings(prev => prev.filter(m => !mappingsToAccept.some(a => a.id === m.id)));
    }, []);

    // Refresh analysis for inferred mappings
    const handleRefreshAnalysis = useCallback(() => {
        setIsAnalyzing(true);
        // Simulate analysis - in real implementation, this would analyze metamodels
        setTimeout(() => {
            // Generate sample inferred mappings based on naming similarity
            const inferred: InferredMapping[] = [];
            // This is a placeholder - real implementation would analyze metamodel structure
            setInferredMappings(inferred);
            setIsAnalyzing(false);
        }, 1500);
    }, []);

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
                handleExecute();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handleExecute]);

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
                canExecute={isValid && sourceMetamodel.length > 0}
                isExecuting={isExecuting}
                onSave={handleSave}
                onExecute={handleExecute}
            />

            {/* Main content area */}
            <div className={`jjtl-dev-env-content jjtl-layout--${layoutMode}`}>
                {/* Left panel - Dual metamodel view (optional) */}
                {layoutMode !== 'editor-only' && !isSidePanelCollapsed && (
                    <div className="jjtl-dev-env-side-panel">
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

                {/* Right panel - Inferred mappings (optional) */}
                {layoutMode === 'split-horizontal' && (
                    <div className="jjtl-dev-env-inferred-panel">
                        <InferredMappingsPanel
                            mappings={inferredMappings}
                            isAnalyzing={isAnalyzing}
                            onAccept={handleAcceptInferred}
                            onAcceptAll={handleAcceptAllInferred}
                            onReject={(m) => setInferredMappings(prev => prev.filter(i => i.id !== m.id))}
                            onRefreshAnalysis={handleRefreshAnalysis}
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
        </div>
    );
};

export default JjtlDevelopmentEnv;
