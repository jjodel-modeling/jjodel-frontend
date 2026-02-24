/**
 * Prompts Settings Section
 * List of all prompts with expand/collapse editors
 */

import React, { useState } from 'react';
import { PromptType, PROMPT_REGISTRY } from '../../types/prompts';
import { PromptService } from '../../services/PromptService';
import { PromptEditor } from './PromptEditor';
import './PromptsSettingsSection.scss';

interface PromptsSettingsSectionProps {
    projectId?: string;  // If provided, shows project-level settings
    onDirtyChange?: (dirty: boolean)=>void;
}

export function PromptsSettingsSection({
    projectId,
    onDirtyChange
}: PromptsSettingsSectionProps): JSX.Element {
    const [expandedPrompt, setExpandedPrompt] = useState<PromptType | null>(null);
    const [showCustomOnly, setShowCustomOnly] = useState(false);

    const promptTypes = Object.keys(PROMPT_REGISTRY) as PromptType[];

    // Filter prompts
    const filteredPrompts = showCustomOnly
        ? promptTypes.filter(type => {
            if (projectId) {
                return PromptService.isProjectCustomized(type, projectId);
            }
            return PromptService.isGlobalCustomized(type);
        })
        : promptTypes;

    // Group by category
    const groupedPrompts = filteredPrompts.reduce((acc, type) => {
        const category = PROMPT_REGISTRY[type].category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(type);
        return acc;
    }, {} as Record<string, PromptType[]>);

    const categoryLabels: Record<string, string> = {
        assistant: 'Assistant Prompts',
        generation: 'Generation Prompts',
        analysis: 'Analysis Prompts',
    };

    const categoryIcons: Record<string, string> = {
        assistant: 'bi-chat-dots',
        generation: 'bi-file-text',
        analysis: 'bi-search',
    };

    return (
        <div className="prompts-settings-section">
            {/* Header */}
            <div className="prompts-section-header">
                <div className="prompts-section-header__info">
                    <h2>AI Prompts</h2>
                    <p>
                        {projectId
                            ? 'Customize AI prompts for this project. Project prompts override global settings.'
                            : 'Customize the default AI prompts used across all projects.'
                        }
                    </p>
                </div>

                <div className="prompts-section-header__actions">
                    <label className="prompts-checkbox-label">
                        <input
                            type="checkbox"
                            checked={showCustomOnly}
                            onChange={(e) => {
                                setShowCustomOnly(e.target.checked);
                                onDirtyChange?.(true);
                            }}
                        />
                        Show customized only
                    </label>
                </div>
            </div>

            {/* Prompt Groups */}
            {Object.entries(groupedPrompts).map(([category, types]) => (
                <div key={category} className="prompt-group">
                    <h3 className="prompt-group__title">
                        <i className={`bi ${categoryIcons[category]}`} />
                        {categoryLabels[category]}
                    </h3>

                    <div className="prompt-group__list">
                        {types.map(type => {
                            const meta = PROMPT_REGISTRY[type];
                            const source = PromptService.getPromptSource(type, projectId);
                            const isExpanded = expandedPrompt === type;

                            return (
                                <div
                                    key={type}
                                    className={`prompt-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                    {/* Card Header (clickable) */}
                                    <div
                                        className="prompt-card__header"
                                        onClick={() => {
                                            setExpandedPrompt(isExpanded ? null : type);
                                            onDirtyChange?.(true);
                                        }}
                                    >
                                        <div className="prompt-card__info">
                                            <span className="prompt-card__name">{meta.name}</span>
                                            <span className={`prompt-card__source source--${source}`}>
                                                {source === 'project' ? 'Project' :
                                                 source === 'global' ? 'Global' :
                                                 'Default'}
                                            </span>
                                        </div>
                                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} />
                                    </div>

                                    {/* Expanded Editor */}
                                    {isExpanded && (
                                        <div className="prompt-card__body">
                                            <PromptEditor
                                                type={type}
                                                projectId={projectId}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Empty state */}
            {filteredPrompts.length === 0 && (
                <div className="prompts-empty-state">
                    <i className="bi bi-file-text" />
                    <p>No customized prompts yet</p>
                    <button
                        className="btn btn--ghost"
                        onClick={() => setShowCustomOnly(false)}
                    >
                        Show all prompts
                    </button>
                </div>
            )}
        </div>
    );
}

export default PromptsSettingsSection;
