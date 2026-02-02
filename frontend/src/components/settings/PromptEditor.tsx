/**
 * Prompt Editor Component
 * Editable prompt with textarea and variable preview
 */

import React, { useState, useCallback } from 'react';
import { PromptType, PromptContext, PROMPT_REGISTRY } from '../../types/prompts';
import { PromptService } from '../../services/PromptService';
import { DEFAULT_PROMPTS } from '../../constants/defaultPrompts';
import './PromptEditor.scss';

interface PromptEditorProps {
    type: PromptType;
    projectId?: string;
    context?: PromptContext;
    onSave?: () => void;
}

export function PromptEditor({
    type,
    projectId,
    context,
    onSave
}: PromptEditorProps): JSX.Element {
    const meta = PROMPT_REGISTRY[type];
    const defaultContent = DEFAULT_PROMPTS[type];

    const [content, setContent] = useState(() =>
        PromptService.get(type, projectId)
    );
    const [showPreview, setShowPreview] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const source = PromptService.getPromptSource(type, projectId);
    const isCustomized = source !== 'default';

    // Handle content change
    const handleChange = useCallback((value: string) => {
        setContent(value);
        setIsDirty(true);
    }, []);

    // Save prompt
    const handleSave = useCallback(() => {
        if (projectId) {
            PromptService.setProjectPrompt(type, projectId, content);
        } else {
            PromptService.setGlobalPrompt(type, content);
        }
        setIsDirty(false);
        onSave?.();
    }, [type, projectId, content, onSave]);

    // Reset to default
    const handleReset = useCallback(() => {
        if (projectId) {
            PromptService.resetProjectPrompt(type, projectId);
            setContent(PromptService.get(type, projectId));
        } else {
            PromptService.resetGlobalPrompt(type);
            setContent(defaultContent);
        }
        setIsDirty(false);
    }, [type, projectId, defaultContent]);

    // Use global (for project prompts)
    const handleUseGlobal = useCallback(() => {
        if (projectId) {
            PromptService.resetProjectPrompt(type, projectId);
            setContent(PromptService.get(type)); // Get global/default
            setIsDirty(false);
        }
    }, [type, projectId]);

    // Render preview
    const previewContent = PromptService.renderTemplate(content, context);

    return (
        <div className="prompt-editor">
            {/* Header */}
            <div className="prompt-editor__header">
                <div className="prompt-editor__info">
                    <h3 className="prompt-editor__title">{meta.name}</h3>
                    <p className="prompt-editor__description">{meta.description}</p>
                    <div className="prompt-editor__badges">
                        <span className={`prompt-badge prompt-badge--${meta.category}`}>
                            {meta.category}
                        </span>
                        <span className={`prompt-badge prompt-badge--source-${source}`}>
                            {source === 'project' ? 'Project Override' :
                             source === 'global' ? 'Global Override' :
                             'Default'}
                        </span>
                        {isDirty && (
                            <span className="prompt-badge prompt-badge--unsaved">Unsaved</span>
                        )}
                    </div>
                </div>

                <div className="prompt-editor__actions">
                    {projectId && source === 'project' && (
                        <button
                            className="btn btn--ghost"
                            onClick={handleUseGlobal}
                            title="Remove project override, use global setting"
                        >
                            Use Global
                        </button>
                    )}
                    {isCustomized && (
                        <button
                            className="btn btn--ghost"
                            onClick={handleReset}
                            title="Reset to default prompt"
                        >
                            <i className="bi bi-arrow-counterclockwise" />
                            Reset
                        </button>
                    )}
                    <button
                        className="btn btn--ghost"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        <i className={`bi bi-${showPreview ? 'code' : 'eye'}`} />
                        {showPreview ? 'Edit' : 'Preview'}
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={handleSave}
                        disabled={!isDirty}
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Editor / Preview */}
            <div className="prompt-editor__content">
                {showPreview ? (
                    <div className="prompt-editor__preview">
                        <pre>{previewContent}</pre>
                    </div>
                ) : (
                    <textarea
                        className="prompt-editor__textarea"
                        value={content}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="Enter prompt..."
                        spellCheck={false}
                    />
                )}
            </div>

            {/* Variable hints */}
            {meta.supportsVariables && !showPreview && (
                <div className="prompt-editor__hints">
                    <span className="hints-label">Available variables:</span>
                    <code>{'{{projectName}}'}</code>
                    <code>{'{{classCount}}'}</code>
                    <code>{'{{#if variable}}...{{/if}}'}</code>
                    <code>{'{{#each classes}}...{{/each}}'}</code>
                </div>
            )}
        </div>
    );
}

export default PromptEditor;
