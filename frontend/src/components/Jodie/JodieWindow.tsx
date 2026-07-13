/**
 * Jodie Window Component
 * Draggable, resizable chat window
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JodieHeader } from './JodieHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import {TAIProvider, ChatImage, ChatDocument, JodieConfig, ConsoleEntry, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor, CodeEntry} from '../../types/jodie';
import { AIDisclaimer } from '../common/AIDisclaimer';
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

interface Position {
    x: number;
    y: number;
}

interface ExecutingCommand {
    command: string;
    lineNumber: number;
    index: number;
    total: number;
}

interface Size {
    width: number;
    height: number;
}

// Resize direction type for 8-way resizing
type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | null;

interface ResizeStart {
    x: number;
    y: number;
    width: number;
    height: number;
    posX: number;
    posY: number;
}

const JODIE_DEFAULT_WIDTH = 760;
const JODIE_DEFAULT_HEIGHT = 520;
const JODIE_DEFAULT_MARGIN = 20;
const JODIE_ANIMATION_MS = 220;
const DEFAULT_SIZE: Size = { width: JODIE_DEFAULT_WIDTH, height: JODIE_DEFAULT_HEIGHT };
const MIN_SIZE: Size = { width: 320, height: 400 };
const MAX_SIZE: Size = { width: 1200, height: 900 };

const computeDefaultPosition = (size: Size = DEFAULT_SIZE): Position => ({
    x: Math.max(0, window.innerWidth - size.width - JODIE_DEFAULT_MARGIN),
    y: Math.max(0, window.innerHeight - size.height - JODIE_DEFAULT_MARGIN),
});

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
    // Load initial position/size from config
    const config = JodieConfig.current;
    const initialSize: Size = config.size || DEFAULT_SIZE;
    const initialPosition: Position = config.position || computeDefaultPosition(initialSize);

    const [position, setPosition] = useState<Position>(initialPosition);
    const [size, setSize] = useState<Size>(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
    const [executingCommand, setExecutingCommand] = useState<ExecutingCommand | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [savedGeometry, setSavedGeometry] = useState<{ position: Position; size: Size } | null>(null);
    const [isAlive, setIsAlive] = useState<boolean>(() => JodieConfig.hasEnabledProviders());
    const [isAnimating, setIsAnimating] = useState(false);

    const windowRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef<Position>({ x: 0, y: 0 });
    const resizeStart = useRef<ResizeStart>({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
    const animationTimeoutRef = useRef<number | null>(null);

    // Programmatic geometry changes (fullscreen/exit/reset) animate; manual drag/resize do not.
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

    // Persist position changes
    const savePosition = useCallback((pos: Position) => {
        JodieConfig.current.position = pos;
        JodieConfig.current.save();
    }, []);

    // Persist size changes
    const saveSize = useCallback((s: Size) => {
        JodieConfig.current.size = s;
        JodieConfig.current.save();
    }, []);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isFullscreen) return;
        const target = e.target as HTMLElement;
        // Don't start drag if clicking on buttons
        if (target.closest('button')) return;

        if (target.closest('.jodie-header')) {
            setIsDragging(true);
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        }
    };

    // Handle resize start for any direction
    const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent) => {
        if (isFullscreen) return;
        e.stopPropagation();
        setResizeDirection(direction);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y,
        };
    };

    // Enter fullscreen: anchor right, full viewport height, default width
    const enterFullscreen = useCallback(() => {
        triggerAnimation();
        setSavedGeometry({ position, size });
        const fsSize: Size = { width: JODIE_DEFAULT_WIDTH, height: window.innerHeight };
        const fsPosition: Position = {
            x: Math.max(0, window.innerWidth - fsSize.width),
            y: 0,
        };
        setSize(fsSize);
        setPosition(fsPosition);
        setIsFullscreen(true);
    }, [position, size, triggerAnimation]);

    // Exit fullscreen: restore previously saved geometry
    const exitFullscreen = useCallback(() => {
        triggerAnimation();
        if (savedGeometry) {
            setSize(savedGeometry.size);
            setPosition(savedGeometry.position);
        }
        setSavedGeometry(null);
        setIsFullscreen(false);
    }, [savedGeometry, triggerAnimation]);

    // Reset: bottom-right with default size; also exits fullscreen if active
    const resetPosition = useCallback(() => {
        triggerAnimation();
        const defaultSize = DEFAULT_SIZE;
        const defaultPos = computeDefaultPosition(defaultSize);
        setSize(defaultSize);
        setPosition(defaultPos);
        setIsFullscreen(false);
        setSavedGeometry(null);
        JodieConfig.current.size = defaultSize;
        JodieConfig.current.position = defaultPos;
        JodieConfig.current.save();
    }, [triggerAnimation]);

    // Track AI provider configuration to drive the alive indicator
    useEffect(() => {
        const refreshAlive = () => setIsAlive(JodieConfig.hasEnabledProviders());
        refreshAlive();
        window.addEventListener(AIEvents.SETTINGS_CHANGED, refreshAlive);
        return () => window.removeEventListener(AIEvents.SETTINGS_CHANGED, refreshAlive);
    }, []);

    // Handle dragging movement
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.width));
            const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - size.height));
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            savePosition(position);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position, size, savePosition]);

    // Handle resize movement for all directions
    useEffect(() => {
        if (!resizeDirection) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;

            let newWidth = resizeStart.current.width;
            let newHeight = resizeStart.current.height;
            let newX = resizeStart.current.posX;
            let newY = resizeStart.current.posY;

            // Calculate new dimensions based on resize direction
            if (resizeDirection.includes('e')) {
                newWidth = Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, resizeStart.current.width + deltaX));
            }
            if (resizeDirection.includes('w')) {
                const potentialWidth = resizeStart.current.width - deltaX;
                if (potentialWidth >= MIN_SIZE.width && potentialWidth <= MAX_SIZE.width) {
                    newWidth = potentialWidth;
                    newX = resizeStart.current.posX + deltaX;
                }
            }
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, resizeStart.current.height + deltaY));
            }
            if (resizeDirection === 'n' || resizeDirection === 'ne' || resizeDirection === 'nw') {
                const potentialHeight = resizeStart.current.height - deltaY;
                if (potentialHeight >= MIN_SIZE.height && potentialHeight <= MAX_SIZE.height) {
                    newHeight = potentialHeight;
                    newY = resizeStart.current.posY + deltaY;
                }
            }

            // Ensure window stays within viewport
            newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setResizeDirection(null);
            saveSize(size);
            savePosition(position);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizeDirection, size, position, saveSize, savePosition]);

    // Keep window in bounds on resize (or re-anchor when fullscreen)
    useEffect(() => {
        const handleWindowResize = () => {
            if (isFullscreen) {
                setSize(prev => ({ width: prev.width, height: window.innerHeight }));
                setPosition(prev => ({
                    x: Math.max(0, window.innerWidth - size.width),
                    y: 0,
                }));
                return;
            }
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - size.width),
                y: Math.min(prev.y, window.innerHeight - size.height),
            }));
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [size, isFullscreen]);

    return (
        <div
            ref={windowRef}
            className={[
                'jodie-window',
                isDragging ? 'jodie-dragging' : '',
                resizeDirection ? 'jodie-resizing' : '',
                isFullscreen ? 'jodie-window--fullscreen' : '',
                isAnimating ? 'jodie-window--animating' : '',
                isVisible ? 'jodie-window--visible' : 'jodie-window--hidden',
            ].filter(Boolean).join(' ')}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Resize Handles (hidden in fullscreen) */}
            {!isFullscreen && (
                <>
                    <div className="jodie-resize-handle nw" onMouseDown={handleResizeStart('nw')} />
                    <div className="jodie-resize-handle ne" onMouseDown={handleResizeStart('ne')} />
                    <div className="jodie-resize-handle sw" onMouseDown={handleResizeStart('sw')} />
                    <div className="jodie-resize-handle se" onMouseDown={handleResizeStart('se')} />
                    <div className="jodie-resize-handle n" onMouseDown={handleResizeStart('n')} />
                    <div className="jodie-resize-handle e" onMouseDown={handleResizeStart('e')} />
                    <div className="jodie-resize-handle s" onMouseDown={handleResizeStart('s')} />
                    <div className="jodie-resize-handle w" onMouseDown={handleResizeStart('w')} />
                </>
            )}

            <JodieHeader
                activeProvider={activeProvider}
                onProviderChange={onProviderChange}
                onClose={onClose}
                onOpenSettings={onOpenSettings}
                onOpenDocumentation={onOpenDocumentation}
                isWaiting={isWaiting}
                isAlive={isAlive}
                isFullscreen={isFullscreen}
                onToggleFullscreen={isFullscreen ? exitFullscreen : enterFullscreen}
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

            <AIDisclaimer feature="chat" />
        </div>
    );
}

export default JodieWindow;
