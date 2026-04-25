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
    TAIProvider, AIConfig, AI, JodieConfig
} from '../../types/jodie';
import { AIProviderService } from '../../services/AIProviderService';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import { JjodieEvents, AIEvents, JjScriptEvents, JjodelEvents } from '../../events/registry';
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
    const settingsModal = useSettingsModalSafe();

    // Chat state
    const [chatState, setChatState] = useState<ChatState>({
        messages: [],
        isOpen: false,
        isMinimized: false,  // Kept for type compatibility
        isWaiting: false,
        hasUnread: false,
    });

    // Active provider (per-feature: 'chat')
    const [activeProvider, setActiveProvider] = useState<TAIProvider>(() => AIConfig.getPreferred('chat'));

    // RAG state
    const lastIndexedProjectRef = useRef<string | null>(null);
    const [ragInitialized, setRagInitialized] = useState(false);

    // Hidden when notifications popover is open (visual focus)
    const [hiddenForPopover, setHiddenForPopover] = useState(false);

    // Pending input prefill (from "Ask Jjodie" link in notifications popover)
    const [pendingPrefill, setPendingPrefill] = useState<{ prompt: string; nonce: number } | null>(null);

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

        window.addEventListener(JjodieEvents.OPEN, handleOpenJodie);
        return () => {
            window.removeEventListener(JjodieEvents.OPEN, handleOpenJodie);
        };
    }, []);

    // Listen for notifications popover toggle (hide Jodie while open)
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ open: boolean }>;
            setHiddenForPopover(!!ce.detail?.open);
        };
        window.addEventListener(JjodelEvents.NOTIFICATIONS_POPOVER_TOGGLE, handler);
        return () => window.removeEventListener(JjodelEvents.NOTIFICATIONS_POPOVER_TOGGLE, handler);
    }, []);

    // Listen for prefill-and-open (from "Ask Jjodie" link in notifications)
    useEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<{ prompt: string }>;
            const prompt = ce.detail?.prompt;
            if (!prompt) return;
            setChatState(prev => ({ ...prev, isOpen: true, hasUnread: false }));
            setPendingPrefill({ prompt, nonce: Date.now() });
        };
        window.addEventListener(JjodelEvents.JODIE_PREFILL_AND_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.JODIE_PREFILL_AND_OPEN, handler);
    }, []);

    // Listen for settings changes from Settings page
    useEffect(() => {
        const handleSettingsChanged = () => {
            // Refresh active provider when settings change
            setActiveProvider(AIConfig.getPreferred('chat'));
        };

        window.addEventListener(AIEvents.SETTINGS_CHANGED, handleSettingsChanged);
        return () => {
            window.removeEventListener(AIEvents.SETTINGS_CHANGED, handleSettingsChanged);
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
                    // console.log('[Jodie] Project indexed for RAG:', project.id);
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
        AIConfig.setPreferred('chat', provider);
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
        if (!AIConfig.get(activeProvider)?.isConfigured()) {
            const enabledProviders = JodieConfig.getEnabledProviders();

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
            AIConfig.setPreferred('chat', firstEnabled);

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

            // Call AI provider with augmented context, images and documents.
            // Pass per-feature model (falls back to provider's AIConfig.model inside chat()).
            const chatModel = AIConfig.getPreferredModel('chat');
            const response = await AIProviderService.chat(content, providerToUse, history, augmentedContext, images, documents, chatModel);

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
        settingsModal?.openSettings('providers');
    }, [settingsModal]);

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
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTED));
        // console.log('[Jjodie] JjScript executed - metamodel refresh triggered');
    }, []);

    return (
        <div className={`jodie-root${hiddenForPopover ? ' jodie-root--hidden' : ''}`}>
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
                    supportsVision={activeVersion?.capabilities.vision || false}
                    supportsPDF={activeVersion?.capabilities.pdf || false}
                    prefilledMessage={pendingPrefill}
                />
            ) : (
                <JodieMinimized
                    activeProvider={activeProvider}
                    hasUnread={chatState.hasUnread}
                    onClick={handleOpen}
                />
            )}
        </div>
    );
}

export default Jodie;
