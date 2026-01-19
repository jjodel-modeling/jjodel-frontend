/**
 * Jodie Component
 * Main container for the AI assistant
 */

import React, { useState, useEffect, useCallback } from 'react';
import { JodieWindow } from './JodieWindow';
import { JodieMinimized } from './JodieMinimized';
import { SettingsModal } from './SettingsModal';
import { AIProvider, ChatMessage, ChatState, PROVIDER_INFO } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';
import './JodieWindow.css';
import './SettingsModal.css';

// Generate unique message ID
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function Jodie(): JSX.Element {
    // Chat state
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isOpen: false,
        isMinimized: false,
        isWaiting: false,
        hasUnread: false,
    });

    // Settings modal state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Active provider
    const [activeProvider, setActiveProvider] = useState<AIProvider>(() =>
        JodieConfigService.getActiveProvider()
    );

    // Listen for open and settings events
    useEffect(() => {
        const handleOpenJodie = () => {
            setChatState(prev => ({ ...prev, isOpen: true, isMinimized: false, hasUnread: false }));
        };

        const handleOpenSettings = () => {
            setIsSettingsOpen(true);
            setChatState(prev => ({ ...prev, isOpen: true, isMinimized: false }));
        };

        window.addEventListener('jodie:open', handleOpenJodie);
        window.addEventListener('jodie:open-settings', handleOpenSettings);
        return () => {
            window.removeEventListener('jodie:open', handleOpenJodie);
            window.removeEventListener('jodie:open-settings', handleOpenSettings);
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
            isMinimized: false,
            hasUnread: false,
        }));
    }, []);

    // Minimize to button
    const handleMinimize = useCallback(() => {
        setChatState(prev => ({
            ...prev,
            isMinimized: true,
        }));
    }, []);

    // Close completely
    const handleClose = useCallback(() => {
        setChatState(prev => ({
            ...prev,
            isOpen: false,
            isMinimized: false,
        }));
    }, []);

    // Change provider
    const handleProviderChange = useCallback((provider: AIProvider) => {
        setActiveProvider(provider);
        JodieConfigService.setActiveProvider(provider);
    }, []);

    // Send message
    const handleSendMessage = useCallback(async (content: string) => {
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

        // Add user message
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isWaiting: true,
        }));

        try {
            // Get conversation history (excluding the message we just added)
            const history = chatState.messages;

            // Call AI provider
            const response = await AIProviderService.chat(content, providerToUse, history);

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
                hasUnread: prev.isMinimized,
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
    }, [activeProvider, chatState.messages]);

    // Open settings
    const handleOpenSettings = useCallback(() => {
        setIsSettingsOpen(true);
    }, []);

    // Close settings
    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
        // Refresh active provider in case it changed
        setActiveProvider(JodieConfigService.getActiveProvider());
    }, []);

    return (
        <>
            {/* Main chat window or minimized button */}
            {chatState.isOpen && !chatState.isMinimized ? (
                <JodieWindow
                    messages={chatState.messages}
                    activeProvider={activeProvider}
                    isWaiting={chatState.isWaiting}
                    onSendMessage={handleSendMessage}
                    onProviderChange={handleProviderChange}
                    onMinimize={handleMinimize}
                    onClose={handleClose}
                    onOpenSettings={handleOpenSettings}
                />
            ) : chatState.isMinimized ? (
                <JodieMinimized
                    activeProvider={activeProvider}
                    hasUnread={chatState.hasUnread}
                    onClick={handleOpen}
                />
            ) : null}

            {/* Settings modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
            />
        </>
    );
}

export default Jodie;
