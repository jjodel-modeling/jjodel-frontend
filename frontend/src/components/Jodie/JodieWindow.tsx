/**
 * Jodie Window Component
 * Docked chat panel (R-JJD-1): a grid column of the project dashboard, resized from its left edge
 */

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { JodieHeader } from './JodieHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import {TAIProvider, ChatImage, ChatDocument, JodieConfig, ConsoleEntry, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor, CodeEntry} from '../../types/jodie';
import { AIEvents, JjScriptEvents } from '../../events/registry';

interface JodieWindowProps {
    messages: ConsoleEntry[];
    activeProvider: TAIProvider;
    isWaiting: boolean;
    onSendMessage: (message: string, images?: ChatImage[], documents?: ChatDocument[]) => void;
    onProviderChange: (provider: TAIProvider) => void;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenDocumentation?: () => void;
    /** Callback when JjScript execution completes (for metamodel refresh) */
    onJjScriptExecuted?: () => void;
    supportsVision?: boolean;
    supportsPDF?: boolean;
    /** External prefill for the chat input (nonce changes to re-trigger same prompt) */
    prefilledMessage?: { prompt: string; nonce: number } | null;
    /** Stop the in-flight AI response (UI-only — no real network abort yet) */
    onStop?: () => void;
    /** Driven by parent: false during enter/exit transitions, true when fully visible */
    isVisible?: boolean;
    /** Active console mode (Chat or Code). Controlled by parent. */
    consoleMode: ConsoleMode;
    onConsoleModeChange: (m: ConsoleMode, via?: ConsoleModeSwitchVia) => void;
    /** Active code flavor (JjEL today; JS reserved for a later phase). */
    codeFlavor: CodeFlavor;
    onCodeFlavorChange: (f: CodeFlavor) => void;
    /** Submit handler for Code mode: parent evaluates and appends a CodeEntry. */
    onSubmitCode: (input: string) => void;
    /** Slash `/help` in Jjodie mode: parent appends a static help entry. */
    onHelpRequested?: () => void;
    /** Unknown `/…` in Jjodie mode: parent appends a static "unknown command" entry. */
    onUnknownCommand?: (raw: string) => void;
    /** Promotion: switch to Code mode and prefill the input with an extracted snippet. */
    onTestInCode: (code: string, language: string | null) => void;
    /** Promotion: switch to Chat mode and prefill the input with a template describing a failed code entry. */
    onAskJjodie: (entry: CodeEntry) => void;
    /** Offer card [Esegui]: run the offered input as JjScript. */
    onOfferExecute?: (messageId: string, input: string) => void;
    /** Offer card [Chiedi a Jjodie]: send the offered input to the LLM. */
    onOfferAsk?: (messageId: string, input: string) => void;
    /** Parse-error card [Chiedi a Jjodie] (D6): one-shot LLM for the input, no mode change. */
    onAskFromError?: (input: string) => void;
    /** Clear all entries of the active console mode (Chat or Code). Optional for backward compat. */
    onClearCurrentMode?: () => void;
    /** True iff the active console mode has at least one entry. Drives the Clear button hint state. */
    canClearCurrentMode?: boolean;
}

interface ExecutingCommand {
    command: string;
    lineNumber: number;
    index: number;
    total: number;
}

// TODO: cleanup — no consumer left since the window stopped aligning to the FAB offsets.
const JODIE_FAB_LEFT = 30;
const JODIE_FAB_BOTTOM = 100;
const JODIE_ANIMATION_MS = 220;
// Dock width bounds (R-JJD-1). Persisted as JodieConfig.dockWidth, written on pointer-up only:
// save() cascades into every provider config, so it never runs per drag frame.
const DOCK_MIN_WIDTH = 420;
const DOCK_MAX_WIDTH = 760;
const DOCK_DEFAULT_WIDTH = 460;
const DOCK_KEY_STEP = 8;
// Body variable the Properties rail offsets its `right` by (declared in styles/tokens/_layout.scss).
const DOCK_WIDTH_VAR = '--jj-jodie-dock-width';

const clampDockWidth = (w: number): number =>
    Math.round(Math.max(DOCK_MIN_WIDTH, Math.min(DOCK_MAX_WIDTH, Number.isFinite(w) ? w : DOCK_DEFAULT_WIDTH)));

// The dock slot is rendered by ProjectDashboard as its last grid column; Jodie is mounted once,
// globally, in App.tsx, so the window reaches the slot through this tiny store and portals into it.
// Where no slot exists (pages other than a project) the window docks to the viewport's right edge.
let dockSlot: HTMLElement | null = null;
const dockSlotListeners = new Set<() => void>();
const setDockSlot = (el: HTMLDivElement | null): void => {
    if (dockSlot === el) return;
    dockSlot = el;
    dockSlotListeners.forEach(l => l());
};
const subscribeDockSlot = (l: () => void): (() => void) => {
    dockSlotListeners.add(l);
    return () => { dockSlotListeners.delete(l); };
};
const getDockSlot = (): HTMLElement | null => dockSlot;

/** Grid column the docked Jodie window portals into (R-JJD-1). Empty, and 0 px wide, while Jodie is closed. */
export function JodieDockSlot(): JSX.Element {
    return <div className="jodie-dock-slot" ref={setDockSlot} />;
}

export function JodieWindow({
    messages,
    activeProvider,
    isWaiting,
    onSendMessage,
    onProviderChange,
    onClose,
    onOpenSettings,
    onOpenDocumentation,
    onJjScriptExecuted,
    supportsVision,
    supportsPDF,
    prefilledMessage,
    onStop,
    isVisible = true,
    consoleMode,
    onConsoleModeChange,
    codeFlavor,
    onCodeFlavorChange,
    onSubmitCode,
    onHelpRequested,
    onUnknownCommand,
    onTestInCode,
    onAskJjodie,
    onOfferExecute,
    onOfferAsk,
    onAskFromError,
    onClearCurrentMode,
    canClearCurrentMode,
}: JodieWindowProps): JSX.Element {
    // Dock width from config; the old floating `position`/`size` stay readable and unused (R-JJD-1).
    const [dockWidth, setDockWidth] = useState<number>(
        () => clampDockWidth(JodieConfig.current.dockWidth ?? DOCK_DEFAULT_WIDTH)
    );
    const [isResizing, setIsResizing] = useState(false);
    const [executingCommand, setExecutingCommand] = useState<ExecutingCommand | null>(null);
    const [isAlive, setIsAlive] = useState<boolean>(() => JodieConfig.hasEnabledProviders());
    const [isAnimating, setIsAnimating] = useState(false);
    const slot = useSyncExternalStore(subscribeDockSlot, getDockSlot);

    const windowRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef<{ x: number; width: number }>({ x: 0, width: 0 });
    const dockWidthRef = useRef<number>(dockWidth);
    dockWidthRef.current = dockWidth;
    const animationTimeoutRef = useRef<number | null>(null);

    // Programmatic geometry changes (reset) animate; manual resize does not.
    const triggerAnimation = useCallback(() => {
        setIsAnimating(true);
        if (animationTimeoutRef.current !== null) {
            window.clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = window.setTimeout(() => {
            setIsAnimating(false);
            animationTimeoutRef.current = null;
        }, JODIE_ANIMATION_MS);
    }, []);

    useEffect(() => () => {
        if (animationTimeoutRef.current !== null) {
            window.clearTimeout(animationTimeoutRef.current);
        }
    }, []);

    // Listen for JjScript execution events
    useEffect(() => {
        const handleExecuting = (e: CustomEvent<ExecutingCommand>) => {
            setExecutingCommand(e.detail);
        };

        const handleExecutionEnd = () => {
            setExecutingCommand(null);
        };

        window.addEventListener(JjScriptEvents.EXECUTING, handleExecuting as EventListener);
        window.addEventListener(JjScriptEvents.EXECUTION_END, handleExecutionEnd);

        return () => {
            window.removeEventListener(JjScriptEvents.EXECUTING, handleExecuting as EventListener);
            window.removeEventListener(JjScriptEvents.EXECUTION_END, handleExecutionEnd);
        };
    }, []);

    // Persist the dock width (pointer-up / key press only, never per drag frame).
    const saveDockWidth = useCallback((w: number) => {
        JodieConfig.current.dockWidth = w;
        JodieConfig.current.save();
    }, []);

    // Left-edge handle: dragging left widens the panel, since the dock sits on the right.
    const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeStart.current = { x: e.clientX, width: dockWidthRef.current };
        setIsResizing(true);
    };

    const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing) return;
        setDockWidth(clampDockWidth(resizeStart.current.width - (e.clientX - resizeStart.current.x)));
    };

    const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isResizing) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        setIsResizing(false);
        saveDockWidth(dockWidthRef.current);
    };

    const handleResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const delta = e.key === 'ArrowLeft' ? DOCK_KEY_STEP : e.key === 'ArrowRight' ? -DOCK_KEY_STEP : 0;
        if (!delta) return;
        e.preventDefault();
        const next = clampDockWidth(dockWidthRef.current + delta);
        setDockWidth(next);
        saveDockWidth(next);
    };

    // Reset: back to the default dock width.
    const resetPosition = useCallback(() => {
        triggerAnimation();
        setDockWidth(DOCK_DEFAULT_WIDTH);
        saveDockWidth(DOCK_DEFAULT_WIDTH);
    }, [triggerAnimation, saveDockWidth]);

    // Publish the dock width for the Properties rail while docked in the dashboard grid;
    // back to 0px when the window closes or the slot goes away.
    useEffect(() => {
        if (!slot) return;
        document.body.style.setProperty(DOCK_WIDTH_VAR, `${dockWidth}px`);
    }, [slot, dockWidth]);

    useEffect(() => {
        if (!slot) return;
        return () => { document.body.style.setProperty(DOCK_WIDTH_VAR, '0px'); };
    }, [slot]);

    // Track AI provider configuration to drive the alive indicator
    useEffect(() => {
        const refreshAlive = () => setIsAlive(JodieConfig.hasEnabledProviders());
        refreshAlive();
        window.addEventListener(AIEvents.SETTINGS_CHANGED, refreshAlive);
        // #168: a key saved in Settings fires PROVIDER_CHANGED only (AIConfig.save).
        window.addEventListener(AIEvents.PROVIDER_CHANGED, refreshAlive);
        return () => {
            window.removeEventListener(AIEvents.SETTINGS_CHANGED, refreshAlive);
            window.removeEventListener(AIEvents.PROVIDER_CHANGED, refreshAlive);
        };
    }, []);

    const panel = (
        <div
            ref={windowRef}
            className={[
                'jodie-window',
                slot ? 'jodie-window--docked' : 'jodie-window--viewport',
                isResizing ? 'jodie-resizing' : '',
                isAnimating ? 'jodie-window--animating' : '',
                isVisible ? 'jodie-window--visible' : 'jodie-window--hidden',
            ].filter(Boolean).join(' ')}
            style={{ width: dockWidth }}
        >
            {/* Vertical drag handle on the left edge (R-JJD-1) */}
            <div
                className="jodie-dock-handle"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize Jjodie panel"
                aria-valuemin={DOCK_MIN_WIDTH}
                aria-valuemax={DOCK_MAX_WIDTH}
                aria-valuenow={dockWidth}
                tabIndex={0}
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerUp}
                onPointerCancel={handleResizePointerUp}
                onKeyDown={handleResizeKeyDown}
            />

            <JodieHeader
                activeProvider={activeProvider}
                onProviderChange={onProviderChange}
                onClose={onClose}
                onOpenSettings={onOpenSettings}
                onOpenDocumentation={onOpenDocumentation}
                isWaiting={isWaiting}
                isAlive={isAlive}
                onResetPosition={resetPosition}
                consoleMode={consoleMode}
                onConsoleModeChange={onConsoleModeChange}
                codeFlavor={codeFlavor}
                onCodeFlavorChange={onCodeFlavorChange}
                onClearCurrentMode={onClearCurrentMode}
                canClearCurrentMode={canClearCurrentMode}
            />

            {/* Executing Command Toolbar */}
            {executingCommand && (
                <div className="jodie-executing-toolbar">
                    <div className="jodie-executing-indicator">
                        <i className="bi bi-terminal jodie-spin" />
                    </div>
                    <div className="jodie-executing-content">
                        <div className="jodie-executing-label">
                            Executing ({executingCommand.index + 1}/{executingCommand.total})
                        </div>
                        <code className="jodie-executing-command">{executingCommand.command}</code>
                    </div>
                </div>
            )}

            <ChatMessages
                messages={messages}
                isWaiting={isWaiting}
                onJjScriptExecuted={onJjScriptExecuted}
                onTestInCode={onTestInCode}
                onAskJjodie={onAskJjodie}
                onOfferExecute={onOfferExecute}
                onOfferAsk={onOfferAsk}
                onAskFromError={onAskFromError}
                onOpenSettings={onOpenSettings}
                providerMissing={!isAlive}
            />

            <ChatInput
                onSend={onSendMessage}
                disabled={isWaiting}
                supportsVision={supportsVision}
                supportsPDF={supportsPDF}
                prefilledMessage={prefilledMessage}
                onStop={onStop}
                onOpenSettings={onOpenSettings}
                consoleMode={consoleMode}
                onConsoleModeChange={onConsoleModeChange}
                codeFlavor={codeFlavor}
                onSubmitCode={onSubmitCode}
                onHelpRequested={onHelpRequested}
                onUnknownCommand={onUnknownCommand}
                entries={messages}
                onClearRequested={onClearCurrentMode}
            />
        </div>
    );

    return slot ? createPortal(panel, slot) : panel;
}

export default JodieWindow;
