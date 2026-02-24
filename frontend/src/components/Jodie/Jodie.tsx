/**
 * Jodie Component
 * Main container for the AI assistant
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { JodieWindow } from './JodieWindow';
import { JodieMinimized } from './JodieMinimized';
import {
    AIProvider,
    ChatMessage,
    ChatImage,
    ChatDocument,
    ChatState,
    TAIProvider, AIConfig, AI
} from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';
import { useSettingsModal } from '../../contexts/SettingsModalContext';
import { JjodieContextService } from '../../services/JjodieContext';
import { JjodieRagService } from '../../services/JjodieRagService';
import {DUser, L, LUser, LProject, store} from '../../joiner';
import DockManager from '../abstract/DockManager';
import TabDataMaker from '../abstract/tabs/TabDataMaker';
import { JjScriptService } from '../../jjscript';
import './JodieWindow.css';

// Generate unique message ID
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function Jodie(): JSX.Element {
    const navigate = useNavigate();
    const { openSettings } = useSettingsModal();

    // Chat state
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isOpen: false,
        isMinimized: false,  // Kept for type compatibility
        isWaiting: false,
        hasUnread: false,
    });

    // Active provider
    const [activeProvider, setActiveProvider] = useState<TAIProvider>(() =>
        JodieConfigService.getActiveProvider()
    );

    // RAG state
    const lastIndexedProjectRef = useRef<string | null>(null);
    const [ragInitialized, setRagInitialized] = useState(false);

    // using state just for caching, so project is not re-computed.
    const user = useMemo(()=> (L.fromPointer(DUser.current) as LUser), []);
    const project = useMemo(()=> user.project, []);
    const userName = useMemo(() => `${user.name || ''} ${user.surname || ''}`.trim(), []);
    const activeVersion = useMemo(() => AI.getActiveVersion(activeProvider), [activeProvider]);
    const state = store.getState();

    // Get current project context for AI
    const projectContext = useMemo((): string | undefined => {
        if (!project) return undefined;
        try { return JjodieContextService.getContextString(project); }
        catch (err) { console.warn('Could not get project context:', err); }
    }, [state.idlookup.clonedCounter]);

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

    // Initialize RAG and index project content
    useEffect(() => {
        const initializeAndIndex = async () => {
            try {
                // Initialize RAG system
                if (!ragInitialized) {
                    await JjodieRagService.initialize();
                    setRagInitialized(true);
                }

                // Get current project
                const user: LUser = L.fromPointer(DUser.current);
                const project = user?.project as LProject;

                if (project?.id && project.id !== lastIndexedProjectRef.current) {
                    // Index project content
                    await JjodieRagService.indexProject(project);
                    lastIndexedProjectRef.current = project.id;
                    console.log('[Jodie] Project indexed for RAG:', project.id);
                }
            } catch (error) {
                console.warn('[Jodie] RAG initialization/indexing failed:', error);
            }
        };

        initializeAndIndex();

        // Re-index periodically to catch updates (every 30 seconds)
        const interval = setInterval(initializeAndIndex, 30000);
        return () => clearInterval(interval);
    }, [ragInitialized]);

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
    const handleProviderChange = useCallback((provider: TAIProvider) => {
        setActiveProvider(provider);
        JodieConfigService.setActiveProvider(provider);
    }, []);

    // Send message
    const handleSendMessage = useCallback(async (content: string, images?: ChatImage[], documents?: ChatDocument[]) => {
        // Check if this is a JjScript command
        if (JjScriptService.isJjScriptCommand(content)) {
            // Add user message
            const userMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'user',
                content,
                timestamp: Date.now(),
                userName,
            };

            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, userMessage],
                isWaiting: true,
            }));

            try {
                // Execute JjScript command
                const result = await JjScriptService.execute(content);

                // Format result as chat message
                const responseContent = JjScriptService.formatResultForChat(result);

                const assistantMessage: ChatMessage = {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: responseContent,
                    timestamp: Date.now(),
                    jjscriptResult: {
                        success: result.success,
                        command: result.command,
                    },
                };

                setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, assistantMessage],
                    isWaiting: false,
                }));
            } catch (error) {
                const errorMessage: ChatMessage = {
                    id: generateMessageId(),
                    role: 'assistant',
                    content: `**JjScript Error:** ${(error as Error).message}`,
                    timestamp: Date.now(),
                    jjscriptResult: {
                        success: false,
                        command: 'unknown',
                    },
                };

                setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, errorMessage],
                    isWaiting: false,
                }));
            }
            return;
        }

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
                content: `Switched to ${AI[firstEnabled].name} (your configured provider).`,
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

            // Get RAG-augmented context based on query
            let augmentedContext = projectContext;
            if (ragInitialized) {
                try {
                    const ragContext = await JjodieRagService.getAugmentedContext(content);
                    if (ragContext) {
                        // Combine structural context with RAG-retrieved context
                        augmentedContext = projectContext
                            ? `${projectContext}\n\n---\n\n**Relevant Information:**\n${ragContext}`
                            : `**Relevant Information:**\n${ragContext}`;
                    }
                } catch (ragError) {
                    console.warn('[Jodie] RAG context retrieval failed:', ragError);
                }
            }

            // Call AI provider with augmented context, images and documents
            const response = await AIProviderService.chat(content, providerToUse, history, augmentedContext, images, documents);

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
    }, [activeProvider, chatState.messages, state.idlookup.clonedCounter /*this means projectContext changed*/, userName]);

    // Open settings - open unified settings modal at Providers section
    const handleOpenSettings = useCallback(() => {
        openSettings('providers');
    }, [openSettings]);

    // Open documentation tab
    const handleOpenDocumentation = useCallback(() => {
        try {
            const tab = TabDataMaker.documentation();
            DockManager.open('editors', tab);
        } catch (err) {
            console.warn('Could not open documentation tab:', err);
        }
    }, []);

    // JjScript execution completed - trigger metamodel refresh
    const handleJjScriptExecuted = useCallback(() => {
        // Emit custom event for metamodel refresh
        window.dispatchEvent(new CustomEvent('jjscript:executed'));
        console.log('[Jjodie] JjScript executed - metamodel refresh triggered');
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
                    onJjScriptExecuted={handleJjScriptExecuted}
                    supportsVision={activeVersion.capabilities.vision}
                    supportsPDF={activeVersion.capabilities.pdf}
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
