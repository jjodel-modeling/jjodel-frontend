/**
 * JjtlToolbar Component
 * Main toolbar for the JjTL development environment
 */

import React, { useCallback } from 'react';

export interface JjtlToolbarProps {
    transformationName?: string;
    sourceMetamodel?: string;
    targetMetamodel?: string;
    hasUnsavedChanges?: boolean;
    canExecute?: boolean;
    isExecuting?: boolean;
    onNew?: () => void;
    onOpen?: () => void;
    onSave?: () => void;
    onSaveAs?: () => void;
    onExecute?: () => void;
    onValidate?: () => void;
    onFormat?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onSelectSourceMetamodel?: () => void;
    onSelectTargetMetamodel?: () => void;
    onSettings?: () => void;
}

export const JjtlToolbar: React.FC<JjtlToolbarProps> = ({
    transformationName = 'Untitled',
    sourceMetamodel,
    targetMetamodel,
    hasUnsavedChanges = false,
    canExecute = false,
    isExecuting = false,
    onNew,
    onOpen,
    onSave,
    onSaveAs,
    onExecute,
    onValidate,
    onFormat,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onSelectSourceMetamodel,
    onSelectTargetMetamodel,
    onSettings,
}) => {
    // Keyboard shortcut hints
    const getShortcutHint = useCallback((key: string, ctrl = true) => {
        const modifier = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
        return `${modifier}+${key}`;
    }, []);

    return (
        <div className="jjtl-toolbar">
            {/* Left section - File operations */}
            <div className="jjtl-toolbar-section">
                <button
                    className="jjtl-toolbar-btn"
                    onClick={onNew}
                    title={`New Transformation (${getShortcutHint('N')})`}
                >
                    <i className="bi bi-file-earmark-plus" />
                </button>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onOpen}
                    title={`Open (${getShortcutHint('O')})`}
                >
                    <i className="bi bi-folder2-open" />
                </button>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onSave}
                    disabled={!hasUnsavedChanges}
                    title={`Save (${getShortcutHint('S')})`}
                >
                    <i className="bi bi-floppy" />
                </button>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onSaveAs}
                    title="Save As..."
                >
                    <i className="bi bi-floppy2" />
                </button>

                <div className="jjtl-toolbar-divider" />
            </div>

            {/* Edit operations */}
            <div className="jjtl-toolbar-section">
                <button
                    className="jjtl-toolbar-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title={`Undo (${getShortcutHint('Z')})`}
                >
                    <i className="bi bi-arrow-counterclockwise" />
                </button>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title={`Redo (${getShortcutHint('Y')})`}
                >
                    <i className="bi bi-arrow-clockwise" />
                </button>

                <div className="jjtl-toolbar-divider" />
            </div>

            {/* Metamodel selectors */}
            <div className="jjtl-toolbar-section jjtl-toolbar-section--metamodels">
                <div className="jjtl-toolbar-metamodel">
                    <span className="jjtl-toolbar-metamodel-label">Source:</span>
                    <button
                        className="jjtl-toolbar-metamodel-btn"
                        onClick={onSelectSourceMetamodel}
                    >
                        {sourceMetamodel || 'Select metamodel...'}
                        <i className="bi bi-chevron-down" />
                    </button>
                </div>

                <i className="bi bi-arrow-right jjtl-toolbar-arrow" />

                <div className="jjtl-toolbar-metamodel">
                    <span className="jjtl-toolbar-metamodel-label">Target:</span>
                    <button
                        className="jjtl-toolbar-metamodel-btn"
                        onClick={onSelectTargetMetamodel}
                    >
                        {targetMetamodel || 'Select metamodel...'}
                        <i className="bi bi-chevron-down" />
                    </button>
                </div>

                <div className="jjtl-toolbar-divider" />
            </div>

            {/* Actions */}
            <div className="jjtl-toolbar-section">
                <button
                    className="jjtl-toolbar-btn"
                    onClick={onValidate}
                    title="Validate Transformation"
                >
                    <i className="bi bi-check2-circle" />
                    <span>Validate</span>
                </button>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onFormat}
                    title={`Format Code (${getShortcutHint('Shift+F')})`}
                >
                    <i className="bi bi-text-indent-left" />
                </button>

                <button
                    className="jjtl-toolbar-btn jjtl-toolbar-btn--primary"
                    onClick={onExecute}
                    disabled={!canExecute || isExecuting}
                    title={`Execute Transformation (${getShortcutHint('Enter')})`}
                >
                    {isExecuting ? (
                        <>
                            <i className="bi bi-arrow-repeat spinning" />
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-play-fill" />
                            <span>Execute</span>
                        </>
                    )}
                </button>
            </div>

            {/* Spacer */}
            <div className="jjtl-toolbar-spacer" />

            {/* Right section - Transformation name and settings */}
            <div className="jjtl-toolbar-section jjtl-toolbar-section--right">
                <div className="jjtl-toolbar-name">
                    <i className="bi bi-diagram-2" />
                    <span>{transformationName}</span>
                    {hasUnsavedChanges && <span className="jjtl-toolbar-unsaved">*</span>}
                </div>

                <button
                    className="jjtl-toolbar-btn"
                    onClick={onSettings}
                    title="Settings"
                >
                    <i className="bi bi-gear" />
                </button>
            </div>
        </div>
    );
};

export default JjtlToolbar;
