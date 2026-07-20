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
    TAIProvider, AIConfig, AI, JodieConfig,
    ConsoleMode, CodeFlavor, CodeEntry, isChatEntry,
    CONSOLE_MODES, ConsoleModeSwitchVia
} from '../../types/jodie';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import { JjodieEvents, AIEvents, JjScriptEvents, JjodelEvents } from '../../events/registry';
import { JjodieContextService, ActiveArtifact } from '../../services/JjodieContext';
import { getActiveModel, getActiveMetamodel, setActiveArtifactCache } from '../../jjscript/executor/utils';
import { JjodieRagService } from '../../services/JjodieRagService';
import {DUser, L, LUser, LProject, store} from '../../joiner';
import DockManager from '../abstract/DockManager';
import TabDataMaker from '../abstract/tabs/TabDataMaker';
import { consoleLanguageRegistry } from './console/languageRegistry';
import type { ConsoleContext } from './console/types';
import './JodieWindow.css';

// Generate unique message ID
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Console language providers, resolved once from the shared registry (the three
// built-ins are registered at module load). Routing decisions below are
// unchanged; only the entry-point dispatch goes through the registry now.
const jjodieProvider = consoleLanguageRegistry.get('jjodie')!;
const jjscriptProvider = consoleLanguageRegistry.get('jjscript')!;
const jjelProvider = consoleLanguageRegistry.get('jjel')!;

// localStorage key for the code-flavor switcher. The console mode itself is no
// longer persisted (2b.3): it boots to 'jjodie' and is sticky only in-memory;
// any legacy 'jjodel.console.mode' value in localStorage is ignored (not cleaned).
const CONSOLE_CODE_FLAVOR_KEY = 'jjodel.console.codeFlavor';

// Static content for the `/help` console entry (Jjodie mode).
const CONSOLE_HELP_TEXT = [
    '**Jjodie console — modes**',
    '',
    '- **Jjodie** — ask in natural language; keyword-first commands still run as JjScript.',
    '- **JjScript** — every line runs as a JjScript command against the model.',
    '- **JjEL** — evaluate JjEL expressions against the model.',
    '',
    '**Switch modes:** `Cmd/Ctrl+J` or `Ctrl+.` cycle · click the mode chip to pick.',
    '',
    '**Slash commands (Jjodie mode):** `/ask` `/js` `/jjel` `/help` · `/clear` clears the current mode.',
].join('\n');

// Persisted, string-typed local state. Local to Jodie: not exported.
function useLocalStorageString<T extends string>(key: string, defaultValue: T): [T, (v: T) => void] {
    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return (stored as T | null) ?? defaultValue;
        } catch {
            return defaultValue;
        }
    });
    const set = useCallback((v: T) => {
        setValue(v);
        try { localStorage.setItem(key, v); } catch { /* ignore quota / privacy */ }
    }, [key]);
    return [value, set];
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

    // Console mode boots to Jjodie and is sticky only in-memory (no persistence, 2b.3).
    const [consoleMode, setConsoleMode] = useState<ConsoleMode>('jjodie');
    // Code flavor (JjEL / JS) is still persisted; JS is reserved for a later phase.
    const [codeFlavor, setCodeFlavor] = useLocalStorageString<CodeFlavor>(CONSOLE_CODE_FLAVOR_KEY, 'jjel');

    // Root ref used by the Cmd+J listener to detect "focus is inside Jjodie".
    const jodieRootRef = useRef<HTMLDivElement>(null);

    // using state just for caching, so user/userName are not re-computed.
    const user = useMemo(()=> (L.fromPointer(DUser.current) as LUser), []);
    const userName = useMemo(() => `${user.name || ''} ${user.surname || ''}`.trim(), []);
    const activeVersion = useMemo(() => AI.getActiveVersion(activeProvider), [activeProvider]);
    const state = store.getState();

    // Counter bumped on EDITOR_TYPE_CHANGE — drives projectContext re-evaluation
    // when the active editor tab changes (independent of redux state churn).
    const [editorChangeCounter, setEditorChangeCounter] = useState(0);

    // Tracks the last artefact for which a context-switch notice was injected,
    // so we don't emit duplicates on tab events that don't actually change focus.
    const lastArtifactRef = useRef<string | undefined>(undefined);

    // Get current project context for AI — reactive to redux state AND active editor changes.
    // Scoped to the metamodel relevant to the active artefact (M1 model or M2 metamodel).
    const projectContext = useMemo((): string | undefined => {
        // Read the project live on every recomputation. A frozen []-deps memo
        // here would capture a mount-time `undefined` (Jodie mounts before the
        // project finishes loading), so the context would never reach the LLM.
        // See docs/discovery/2026-06-12_prompt_render_bug.md (Q3, Fix 1).
        const project = user.project;
        if (!project) return undefined;
        try {
            const activeModel = getActiveModel();
            const activeMetamodel = getActiveMetamodel();
            let activeArtifact: ActiveArtifact | undefined;
            if (activeModel) {
                const inst = (activeModel as any).instanceof ?? (activeModel as any).metamodel;
                const mmId = typeof inst === 'string' ? inst : inst?.id;
                activeArtifact = {
                    id: activeModel.id,
                    name: activeModel.name ?? 'Unnamed',
                    level: 'M1',
                    metamodelId: mmId,
                };
            } else if (activeMetamodel) {
                activeArtifact = {
                    id: activeMetamodel.id,
                    name: activeMetamodel.name ?? 'Unnamed',
                    level: 'M2',
                };
            }
            return JjodieContextService.getContextString(project as LProject, activeArtifact);
        }
        catch (err) { console.warn('Could not get project context:', err); }
    }, [state.idlookup.clonedCounter, editorChangeCounter]);

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

    // Seed the active artefact cache at mount, in case Jodie is opened without
    // the user ever switching tabs (cold start). Uses the existing fallback
    // resolution (DockManager + _lastSelected) to find what's currently active.
    useEffect(() => {
        const m = getActiveModel();
        if (m) {
            setActiveArtifactCache(m.id, 'model');
            return;
        }
        const mm = getActiveMetamodel();
        if (mm) {
            setActiveArtifactCache(mm.id, 'metamodel');
        }
    }, []);

    // Listen for editor tab changes — refresh projectContext and inject a chat
    // notice if the focused artefact changed mid-conversation.
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;

            // Update the global cache used by getActiveModel/getActiveMetamodel
            // so non-React contexts (JjScript service) read the fresh artefact.
            if (detail?.modelId && detail?.editorType) {
                setActiveArtifactCache(detail.modelId, detail.editorType);
            }

            setEditorChangeCounter(c => c + 1);

            const newModel = getActiveModel();
            const newMeta = getActiveMetamodel();
            const newName = newModel?.name ?? newMeta?.name;
            const newLevel = newModel ? 'M1 model' : 'M2 metamodel';

            if (!newName || newName === lastArtifactRef.current) return;
            const wasInitialized = lastArtifactRef.current !== undefined;
            lastArtifactRef.current = newName;

            // Skip the very first resolution (mount/initial tab opening).
            // Only inject the notice when we already had a previous artefact.
            if (!wasInitialized) return;

            setChatState(prev => {
                if (!prev.messages || prev.messages.length === 0) return prev;
                return {
                    ...prev,
                    messages: [
                        ...prev.messages,
                        {
                            id: generateMessageId(),
                            kind: 'chat',
                            role: 'assistant',
                            content: `_Context switched to: **${newName}** (${newLevel})_`,
                            timestamp: Date.now(),
                        }
                    ]
                };
            });
        };
        window.addEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handler);
        return () => window.removeEventListener(JjodelEvents.EDITOR_TYPE_CHANGE, handler);
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

    // Central mode-change funnel. Every user-facing switch (cycle, picker, slash)
    // goes through here so it announces itself on the bus — groundwork for 2b.3,
    // no consumer yet. Programmatic promotions use setConsoleMode directly.
    const setMode = useCallback((next: ConsoleMode, via?: ConsoleModeSwitchVia) => {
        if (consoleMode !== next) {
            window.dispatchEvent(new CustomEvent(JjodieEvents.CONSOLE_MODE_CHANGE, {
                detail: { from: consoleMode, to: next, via },
            }));
        }
        setConsoleMode(next);
    }, [consoleMode, setConsoleMode]);

    // Cycle jjodie → jjscript → jjel → jjodie.
    const cycleMode = useCallback((via: ConsoleModeSwitchVia) => {
        const idx = CONSOLE_MODES.indexOf(consoleMode);
        const next = CONSOLE_MODES[(idx + 1) % CONSOLE_MODES.length];
        setMode(next, via);
    }, [consoleMode, setMode]);

    // Cmd+J / Ctrl+J and Ctrl+. cycle the console mode (jjodie → jjscript → jjel).
    // Skip when focus is in another editable surface (Monaco or any input/textarea
    // outside Jjodie); always handle when focus is inside Jjodie or nowhere editable.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isCmdJ = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j';
            const isCtrlDot = e.ctrlKey && !e.metaKey && (e.key === '.' || e.code === 'Period');
            if (!isCmdJ && !isCtrlDot) return;

            const target = e.target as HTMLElement | null;
            const focusInJjodie = !!jodieRootRef.current && !!target && jodieRootRef.current.contains(target);
            const isEditable = !!target && !!target.closest('input, textarea, [contenteditable], .monaco-editor');
            if (isEditable && !focusInJjodie) return;

            e.preventDefault();
            cycleMode(isCtrlDot ? 'ctrl-dot' : 'cmdj');
            // Make sure the window is open so the user sees the switch take effect.
            setChatState(prev => prev.isOpen ? prev : { ...prev, isOpen: true, hasUnread: false });
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [cycleMode]);

    // Submit a JjEL expression from the Code-mode input. Synchronous evaluator:
    // append the input + result (or error) as a single CodeEntry to the unified history.
    const handleSubmitCode = useCallback(async (rawInput: string) => {
        const input = rawInput.trim();
        if (!input) return;
        // Route Code-mode input through the jjel provider (behavior-preserving:
        // same CodeEntry as the inline path). Async only because the provider
        // interface is Promise-based; the JjEL evaluation itself is synchronous.
        const ctx: ConsoleContext = { makeId: generateMessageId, codeFlavor };
        const { entries } = await jjelProvider.run(input, ctx);
        setChatState(prev => ({ ...prev, messages: [...prev.messages, ...entries] }));
    }, [codeFlavor]);

    // Promotion: from a Jjodie chat reply with a code block, switch to Code mode
    // and prefill the input with the extracted snippet (no auto-run).
    const handleTestInCode = useCallback((code: string, _language: string | null) => {
        // TODO stadio 3: when JS flavor is enabled, route 'js'/'javascript' tags to flavor 'js'.
        // For now everything goes to JjEL; JS-tagged snippets may show JjEL syntax errors,
        // which the user can refine in place.
        setConsoleMode('jjel');
        setCodeFlavor('jjel');
        setPendingPrefill({ prompt: code, nonce: Date.now() });
    }, [setConsoleMode, setCodeFlavor]);

    // Promotion: from a failed Code-mode result, switch to Chat mode and prefill the input
    // with a template that describes the failed expression (no auto-send).
    const handleAskJjodie = useCallback((entry: CodeEntry) => {
        if (entry.output.ok) return;
        const langLabel = entry.flavor === 'jjel' ? 'JjEL' : 'JS';
        const template = `This ${langLabel} expression failed:\n\n\`${entry.input}\`\n\nError: ${entry.output.error}\n\n`;
        setConsoleMode('jjodie');
        setPendingPrefill({ prompt: template, nonce: Date.now() });
    }, [setConsoleMode]);

    // Slash `/help` in Jjodie mode: append a static system entry describing the
    // modes, shortcuts and slash commands.
    const handleHelpRequested = useCallback(() => {
        const helpMessage: ChatMessage = {
            id: generateMessageId(),
            kind: 'chat',
            role: 'assistant',
            content: CONSOLE_HELP_TEXT,
            timestamp: Date.now(),
        };
        setChatState(prev => ({ ...prev, messages: [...prev.messages, helpMessage] }));
    }, []);

    // Unknown `/…` in Jjodie mode: append a static hint instead of sending the
    // typo to the LLM (no provider call).
    const handleUnknownCommand = useCallback((raw: string) => {
        const cmd = raw.trim().split(/\s+/)[0];
        const entry: ChatMessage = {
            id: generateMessageId(),
            kind: 'chat',
            role: 'assistant',
            content: `Unknown command: ${cmd}. Type /help to see available commands.`,
            timestamp: Date.now(),
        };
        setChatState(prev => ({ ...prev, messages: [...prev.messages, entry] }));
    }, []);

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
        // Explicit JjScript mode routes ALL input to the jjscript provider.
        if (consoleMode === 'jjscript') {
            // Add user message
            const userMessage: ChatMessage = {
                id: generateMessageId(),
                kind: 'chat',
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
                // Route JjScript execution through the jjscript provider
                // (behavior-preserving: same assistant ChatMessage carrying
                // jjscriptResult:{success,command}). Errors propagate to the
                // catch below, which builds the "JjScript Error" message.
                const ctx: ConsoleContext = { makeId: generateMessageId };
                const { entries } = await jjscriptProvider.run(content, ctx);

                setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, ...entries],
                    isWaiting: false,
                }));
            } catch (error) {
                const errorMessage: ChatMessage = {
                    id: generateMessageId(),
                    kind: 'chat',
                    role: 'assistant',
                    content: `**JjScript Error:** ${(error as Error).message}`,
                    timestamp: Date.now(),
                    jjscriptResult: {
                        success: false,
                        command: 'unknown',
                        input: content,
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

        // Jjodie mode: if the input parses as a complete JjScript command, OFFER
        // to run it — never execute and never call the LLM until the user taps a
        // button. Deterministic (strict parse), not silent.
        if (jjscriptProvider.detect?.(content)) {
            const offerMessage: ChatMessage = {
                id: generateMessageId(),
                kind: 'chat',
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                jjscriptOffer: { input: content },
            };
            setChatState(prev => ({ ...prev, messages: [...prev.messages, offerMessage] }));
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
                    kind: 'chat',
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
                kind: 'chat',
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
            kind: 'chat',
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
            // Get conversation history (excluding the message we just added).
            // Filter out CodeEntry items: the jjodie provider forwards ChatMessage[] only.
            const history = chatState.messages.filter(isChatEntry);

            // Route the LLM call through the jjodie provider (behavior-preserving:
            // same RAG augmentation, per-feature model, and assistant ChatMessage).
            // chat() errors propagate to the catch below, which preserves the
            // hasUnread semantics (only the success path sets hasUnread).
            const ctx: ConsoleContext = {
                makeId: generateMessageId,
                activeProvider: providerToUse,
                history,
                projectContext,
                ragInitialized,
                images,
                documents,
            };
            const { entries } = await jjodieProvider.run(content, ctx);

            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, ...entries],
                isWaiting: false,
                hasUnread: !prev.isOpen,
            }));
        } catch (error) {
            // Add error message
            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                kind: 'chat',
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
    }, [activeProvider, chatState.messages, consoleMode, state.idlookup.clonedCounter, projectContext, userName]);

    // Shared one-shot "Ask Jjodie": send `input` to the LLM and append the reply,
    // WITHOUT changing mode. Used by the offer card's [Chiedi a Jjodie] and by the
    // [Chiedi a Jjodie] button on a JjScript parse-error card (D6). No auto-switch in v1.
    const askJjodie = useCallback(async (input: string) => {
        setChatState(prev => ({ ...prev, isWaiting: true }));
        try {
            const history = chatState.messages.filter(isChatEntry);
            const ctx: ConsoleContext = {
                makeId: generateMessageId,
                activeProvider,
                history,
                projectContext,
                ragInitialized,
            };
            const { entries } = await jjodieProvider.run(input, ctx);
            setChatState(prev => ({
                ...prev,
                messages: [...prev.messages, ...entries],
                isWaiting: false,
                hasUnread: !prev.isOpen,
            }));
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                kind: 'chat',
                role: 'assistant',
                content: `Sorry, I encountered an error: ${(error as Error).message}. Please check your API key in Settings.`,
                timestamp: Date.now(),
                provider: activeProvider,
            };
            setChatState(prev => ({ ...prev, messages: [...prev.messages, errorMessage], isWaiting: false }));
        }
    }, [activeProvider, chatState.messages, projectContext, ragInitialized]);

    // Disable an offer entry's buttons after a tap (marks it consumed by id).
    const markOfferConsumed = useCallback((messageId: string) => {
        setChatState(prev => ({
            ...prev,
            messages: prev.messages.map(m =>
                isChatEntry(m) && m.id === messageId && m.jjscriptOffer
                    ? { ...m, jjscriptOffer: { ...m.jjscriptOffer, consumed: true } }
                    : m
            ),
        }));
    }, []);

    // Offer card [Esegui]: run the offered input as JjScript, append the result card.
    const handleOfferExecute = useCallback(async (messageId: string, input: string) => {
        markOfferConsumed(messageId);
        setChatState(prev => ({ ...prev, isWaiting: true }));
        try {
            const ctx: ConsoleContext = { makeId: generateMessageId };
            const { entries } = await jjscriptProvider.run(input, ctx);
            setChatState(prev => ({ ...prev, messages: [...prev.messages, ...entries], isWaiting: false }));
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                kind: 'chat',
                role: 'assistant',
                content: `**JjScript Error:** ${(error as Error).message}`,
                timestamp: Date.now(),
                jjscriptResult: { success: false, command: 'unknown', input },
            };
            setChatState(prev => ({ ...prev, messages: [...prev.messages, errorMessage], isWaiting: false }));
        }
    }, [markOfferConsumed]);

    // Offer card [Chiedi a Jjodie]: send the offered input to the LLM instead.
    const handleOfferAsk = useCallback((messageId: string, input: string) => {
        markOfferConsumed(messageId);
        askJjodie(input);
    }, [markOfferConsumed, askJjodie]);

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

    // Stop AI generation (UI-only — fetch is not actually aborted, see context-2026-04-21).
    // The in-flight request will still resolve in the background; we only flip isWaiting
    // so the user can type again.
    const handleStop = useCallback(() => {
        setChatState(prev => ({ ...prev, isWaiting: false }));
    }, []);

    // Clear the entries belonging to the current console mode (Chat or Code).
    // History is non-persisted, so we just filter the in-memory unified array.
    // Returns prev unchanged when nothing matches, so the button click is a true
    // no-op when the active mode is already empty (no spurious re-render).
    const handleClearCurrentMode = useCallback(() => {
        setChatState(prev => {
            const next = prev.messages.filter(e =>
                consoleMode === 'jjel' ? e.kind !== 'code' : e.kind === 'code'
            );
            if (next.length === prev.messages.length) return prev;
            return { ...prev, messages: next };
        });
    }, [consoleMode]);

    const canClearCurrentMode = useMemo(
        () => chatState.messages.some(e =>
            consoleMode === 'jjel' ? e.kind === 'code' : e.kind !== 'code'
        ),
        [chatState.messages, consoleMode]
    );

    // Open/close transition: keep JodieWindow mounted during the exit fade-out.
    // - `windowRendered`: controls whether <JodieWindow> is in the React tree
    // - `windowVisible`: drives the --visible/--hidden CSS modifier (opacity/transform)
    const JODIE_EXIT_DURATION_MS = 170;
    const [windowRendered, setWindowRendered] = useState<boolean>(chatState.isOpen);
    const [windowVisible, setWindowVisible] = useState<boolean>(chatState.isOpen);

    useEffect(() => {
        let raf1: number | null = null;
        let raf2: number | null = null;
        let exitTimeout: number | null = null;

        if (chatState.isOpen) {
            setWindowRendered(true);
            // Two rAFs: ensure the initial --hidden frame paints before flipping
            // to --visible, otherwise React batching skips the entry transition.
            raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => setWindowVisible(true));
            });
        } else {
            setWindowVisible(false);
            exitTimeout = window.setTimeout(() => {
                setWindowRendered(false);
            }, JODIE_EXIT_DURATION_MS);
        }

        return () => {
            if (raf1 !== null) cancelAnimationFrame(raf1);
            if (raf2 !== null) cancelAnimationFrame(raf2);
            if (exitTimeout !== null) window.clearTimeout(exitTimeout);
        };
    }, [chatState.isOpen]);

    return (
        <div ref={jodieRootRef} className={`jodie-root${hiddenForPopover ? ' jodie-root--hidden' : ''}`}>
            {/* Window stays mounted during exit transition; FAB only renders after unmount. */}
            {windowRendered ? (
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
                    onStop={handleStop}
                    isVisible={windowVisible}
                    consoleMode={consoleMode}
                    onConsoleModeChange={setMode}
                    codeFlavor={codeFlavor}
                    onCodeFlavorChange={setCodeFlavor}
                    onSubmitCode={handleSubmitCode}
                    onHelpRequested={handleHelpRequested}
                    onUnknownCommand={handleUnknownCommand}
                    onTestInCode={handleTestInCode}
                    onAskJjodie={handleAskJjodie}
                    onOfferExecute={handleOfferExecute}
                    onOfferAsk={handleOfferAsk}
                    onAskFromError={askJjodie}
                    onClearCurrentMode={handleClearCurrentMode}
                    canClearCurrentMode={canClearCurrentMode}
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
