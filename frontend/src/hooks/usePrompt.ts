/**
 * usePrompt Hook
 * React hook for accessing and managing prompts
 */

import { useState, useEffect, useCallback } from 'react';
import { PromptType, PromptContext, PROMPT_REGISTRY } from '../types/prompts';
import { PromptService } from '../services/PromptService';
import { DEFAULT_PROMPTS } from '../constants/defaultPrompts';
import { AIEvents } from '../events/registry';

interface UsePromptOptions {
    projectId?: string;
    context?: PromptContext;
    autoRender?: boolean;
}

interface UsePromptReturn {
    // Current prompt content
    content: string;
    renderedContent: string;

    // Source info
    source: 'project' | 'global' | 'default';
    isCustomized: boolean;

    // Actions
    setContent: (content: string) => void;
    reset: () => void;

    // Metadata
    meta: typeof PROMPT_REGISTRY[PromptType];
    defaultContent: string;
}

/**
 * Hook to use a specific prompt
 */
export function usePrompt(
    type: PromptType,
    options: UsePromptOptions = {}
): UsePromptReturn {
    const { projectId, context, autoRender = true } = options;

    const [content, setContentState] = useState(() =>
        PromptService.get(type, projectId)
    );

    // Listen for prompt changes
    useEffect(() => {
        const handleChange = (e: Event) => {
            const customEvent = e as CustomEvent<{ type: PromptType; scope: string }>;
            if (customEvent.detail.type === type) {
                setContentState(PromptService.get(type, projectId));
            }
        };

        window.addEventListener(AIEvents.PROMPT_CHANGED, handleChange);
        return () => {
            window.removeEventListener(AIEvents.PROMPT_CHANGED, handleChange);
        };
    }, [type, projectId]);

    // Set content
    const setContent = useCallback((newContent: string) => {
        if (projectId) {
            PromptService.setProjectPrompt(type, projectId, newContent);
        } else {
            PromptService.setGlobalPrompt(type, newContent);
        }
        setContentState(newContent);
    }, [type, projectId]);

    // Reset to default/fallback
    const reset = useCallback(() => {
        if (projectId) {
            PromptService.resetProjectPrompt(type, projectId);
        } else {
            PromptService.resetGlobalPrompt(type);
        }
        setContentState(PromptService.get(type, projectId));
    }, [type, projectId]);

    // Compute derived values
    const source = PromptService.getPromptSource(type, projectId);
    const isCustomized = source !== 'default';
    const renderedContent = autoRender
        ? PromptService.renderTemplate(content, context)
        : content;

    return {
        content,
        renderedContent,
        source,
        isCustomized,
        setContent,
        reset,
        meta: PROMPT_REGISTRY[type],
        defaultContent: DEFAULT_PROMPTS[type],
    };
}

/**
 * Hook to manage all prompts (for settings page)
 */
export function useAllPrompts(projectId?: string) {
    const [prompts, setPrompts] = useState<Record<PromptType, string>>(() => {
        const result: Partial<Record<PromptType, string>> = {};
        for (const type of Object.keys(PROMPT_REGISTRY) as PromptType[]) {
            result[type] = PromptService.get(type, projectId);
        }
        return result as Record<PromptType, string>;
    });

    // Refresh all prompts
    const refresh = useCallback(() => {
        const result: Partial<Record<PromptType, string>> = {};
        for (const type of Object.keys(PROMPT_REGISTRY) as PromptType[]) {
            result[type] = PromptService.get(type, projectId);
        }
        setPrompts(result as Record<PromptType, string>);
    }, [projectId]);

    // Listen for changes
    useEffect(() => {
        window.addEventListener(AIEvents.PROMPT_CHANGED, refresh);
        return () => window.removeEventListener(AIEvents.PROMPT_CHANGED, refresh);
    }, [refresh]);

    return {
        prompts,
        refresh,
        registry: PROMPT_REGISTRY,
    };
}

export default usePrompt;
