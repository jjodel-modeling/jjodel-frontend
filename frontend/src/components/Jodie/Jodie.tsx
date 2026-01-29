/**
 * Jodie Component
 * Main container for the AI assistant
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JodieWindow } from './JodieWindow';
import { JodieMinimized } from './JodieMinimized';
import { AIProvider, ChatMessage, ChatImage, ChatDocument, ChatState, PROVIDER_INFO, supportsVision, supportsPDF } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';
import { useAISettings } from '../../contexts/AISettingsContext';
import { JjodieContextService } from '../../services/JjodieContext';
import { DUser, L, LUser, LProject } from '../../joiner';
import DockManager from '../abstract/DockManager';
import TabDataMaker from '../abstract/tabs/TabDataMaker';
import './JodieWindow.css';

// Generate unique message ID
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function Jodie(): JSX.Element {
    const navigate = useNavigate();
    const { openAISettings } = useAISettings();

    // Chat state
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isOpen: false,
        isMinimized: false,  // Kept for type compatibility
        isWaiting: false,
        hasUnread: false,
    });

    // Active provider
    const [activeProvider, setActiveProvider] = useState<AIProvider>(() =>
        JodieConfigService.getActiveProvider()
    );

    // Get current user name
    const userName = useMemo(() => {
        try {
            const user: LUser = L.fromPointer(DUser.current);
            if (user) {
                const fullName = `${user.name || ''} ${user.surname || ''}`.trim();
                return fullName || 'You';
            }
        } catch {
            // Fallback if user not available
        }
        return 'You';
    }, []);

    // Check if current provider supports vision
    const providerSupportsVision = useMemo(() => {
        const config = JodieConfigService.getProvider(activeProvider);
        return supportsVision(activeProvider, config?.model);
    }, [activeProvider]);

    // Check if current provider supports PDF documents
    const providerSupportsPDF = useMemo(() => {
        const config = JodieConfigService.getProvider(activeProvider);
        return supportsPDF(activeProvider, config?.model);
    }, [activeProvider]);

    // Get current project context for AI
    const getProjectContext = useCallback((): string | undefined => {
        try {
            const user: LUser = L.fromPointer(DUser.current);
            if (user?.project) {
                const project = user.project as LProject;
                if (project) {
                    return JjodieContextService.getContextString(project);
                }
            }
        } catch (err) {
            console.warn('Could not get project context:', err);
        }
        return undefined;
    }, []);

    // Listen for open event
    useEffect(() => {
        const handleOpenJodie = () => {
            setChatState(prev => ({ ...prev, isOpen: true, hasUnread: false }));
        };

        window.addEventListener('jodie:open', handleOpenJodie);
        return () => {
            window.removeEventListener('jodie:open', handleOpenJodie);
        };
    }, []);

    // Listen for settings changes from Settings page
    useEffect(() => {
        const handleSettingsChanged = () => {
            // Refresh active provider when settings change
            setActiveProvider(JodieConfigService.getActiveProvider());
        };

        window.addEventListener('ai-settings-changed', handleSettingsChanged);
        return () => {
            window.removeEventListener('ai-settings-changed', handleSettingsChanged);
        };
    }, []);

    // Auto-switch to first configured provider if current one is not configured
    useEffect(() => {
        const enabledProviders = JodieConfigService.getEnabledProviders();

        if (enabledProviders.length > 0 && !enabledProviders.includes(activeProvider)) {
            // Current provider not configured, switch to first available
            const firstEnabled = enabledProviders[0];
            setActiveProvider(firstEnabled);
            JodieConfigService.setActiveProvider(firstEnabled);
        }
    }, [activeProvider]);

    // Open the chat window
    const handleOpen = useCallback(() => {
        setChatState(prev => ({
            ...prev,
            isOpen: true,
            hasUnread: false,
        }));
    }, []);

    // Close the chat window
    const handleClose = useCallback(() => {
        setChatState(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    // Change provider
    const handleProviderChange = useCallback((provider: AIProvider) => {
        setActiveProvider(provider);
        JodieConfigService.setActiveProvider(provider);
    }, []);

    // Send message
    const handleSendMessage = useCallback(async (content: string, images?: ChatImage[], documents?: ChatDocument[]) => {
        // Determine which provider to use
        let providerToUse = activeProvider;

        // Validate that current provider is configured
        if (!JodieConfigService.isProviderConfigured(activeProvider)) {
            const enabledProviders = JodieConfigService.getEnabledProviders();

            if (enabledProviders.length === 0) {
                // No providers configured at all
                const errorMessage: ChatMessage = {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: 'No AI providers configured. Please click the Settings button to configure at least one provider with your API key.',
                    timestamp: Date.now(),
                };
                setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, errorMessage],
                }));
                return;
            }

            // Auto-switch to first available provider
            const firstEnabled = enabledProviders[0];
            providerToUse = firstEnabled;
            setActiveProvider(firstEnabled);
            JodieConfigService.setActiveProvider(firstEnabled);

            // Add info message about switching
            const switchMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: `Switched to ${PROVIDER_INFO[firstEnabled].name} (your configured provider).`,
                timestamp: Date.now(),
            };
            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, switchMessage],
            }));
        }

        // Add user message (with images/documents if present)
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content,
            timestamp: Date.now(),
            userName,
            images,
            documents,
        };

        setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isWaiting: true,
        }));

        try {
            // Get conversation history (excluding the message we just added)
            const history = chatState.messages;

            // Get current project context
            const projectContext = getProjectContext();

            // Call AI provider with context, images and documents
            const response = await AIProviderService.chat(content, providerToUse, history, projectContext, images, documents);

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
                provider: providerToUse,
            };

            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, assistantMessage],
                isWaiting: false,
                hasUnread: !prev.isOpen,
            }));
        } catch (error) {
            // Add error message
            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${(error as Error).message}. Please check your API key in Settings.`,
                timestamp: Date.now(),
                provider: providerToUse,
            };

            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, errorMessage],
                isWaiting: false,
            }));
        }
    }, [activeProvider, chatState.messages, getProjectContext, userName]);

    // Open settings - show AI Settings modal
    const handleOpenSettings = useCallback(() => {
        openAISettings();
    }, [openAISettings]);

    // Open documentation tab
    const handleOpenDocumentation = useCallback(() => {
        try {
            const tab = TabDataMaker.documentation();
            DockManager.open('editors', tab);
        } catch (err) {
            console.warn('Could not open documentation tab:', err);
        }
    }, []);

    return (
        <>
            {/* Main chat window or FAB */}
            {chatState.isOpen ? (
                <JodieWindow
                    messages={chatState.messages}
                    activeProvider={activeProvider}
                    isWaiting={chatState.isWaiting}
                    onSendMessage={handleSendMessage}
                    onProviderChange={handleProviderChange}
                    onClose={handleClose}
                    onOpenSettings={handleOpenSettings}
                    onOpenDocumentation={handleOpenDocumentation}
                    supportsVision={providerSupportsVision}
                    supportsPDF={providerSupportsPDF}
                />
            ) : (
                <JodieMinimized
                    activeProvider={activeProvider}
                    hasUnread={chatState.hasUnread}
                    onClick={handleOpen}
                />
            )}
        </>
    );
}

export default Jodie;
