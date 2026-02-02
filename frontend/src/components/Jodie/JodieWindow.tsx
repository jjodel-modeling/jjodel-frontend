/**
 * Jodie Window Component
 * Draggable, resizable chat window
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JodieHeader } from './JodieHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AIProvider, ChatMessage, ChatImage, ChatDocument } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';

interface JodieWindowProps {
    messages: ChatMessage[];
    activeProvider: AIProvider;
    isWaiting: boolean;
    onSendMessage: (message: string, images?: ChatImage[], documents?: ChatDocument[]) => void;
    onProviderChange: (provider: AIProvider) => void;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenDocumentation?: () => void;
    supportsVision?: boolean;
    supportsPDF?: boolean;
}

interface Position {
    x: number;
    y: number;
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

const DEFAULT_SIZE: Size = { width: 380, height: 520 };
const MIN_SIZE: Size = { width: 320, height: 400 };
const MAX_SIZE: Size = { width: 1200, height: 900 };

export function JodieWindow({
    messages,
    activeProvider,
    isWaiting,
    onSendMessage,
    onProviderChange,
    onClose,
    onOpenSettings,
    onOpenDocumentation,
    supportsVision,
    supportsPDF,
}: JodieWindowProps): JSX.Element {
    // Load initial position/size from config
    const config = JodieConfigService.load();
    const initialPosition: Position = config.position || {
        x: window.innerWidth - DEFAULT_SIZE.width - 20,
        y: window.innerHeight - DEFAULT_SIZE.height - 20,
    };
    const initialSize: Size = config.size || DEFAULT_SIZE;

    const [position, setPosition] = useState<Position>(initialPosition);
    const [size, setSize] = useState<Size>(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);

    const windowRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef<Position>({ x: 0, y: 0 });
    const resizeStart = useRef<ResizeStart>({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

    // Persist position changes
    const savePosition = useCallback((pos: Position) => {
        JodieConfigService.updatePosition(pos);
    }, []);

    // Persist size changes
    const saveSize = useCallback((s: Size) => {
        JodieConfigService.updateSize(s);
    }, []);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
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

    // Keep window in bounds on resize
    useEffect(() => {
        const handleWindowResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - size.width),
                y: Math.min(prev.y, window.innerHeight - size.height),
            }));
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [size]);

    return (
        <div
            ref={windowRef}
            className={`jodie-window ${isDragging ? 'jodie-dragging' : ''} ${resizeDirection ? 'jodie-resizing' : ''}`}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Resize Handles - Corners */}
            <div className="jodie-resize-handle nw" onMouseDown={handleResizeStart('nw')} />
            <div className="jodie-resize-handle ne" onMouseDown={handleResizeStart('ne')} />
            <div className="jodie-resize-handle sw" onMouseDown={handleResizeStart('sw')} />
            <div className="jodie-resize-handle se" onMouseDown={handleResizeStart('se')} />

            {/* Resize Handles - Edges */}
            <div className="jodie-resize-handle n" onMouseDown={handleResizeStart('n')} />
            <div className="jodie-resize-handle e" onMouseDown={handleResizeStart('e')} />
            <div className="jodie-resize-handle s" onMouseDown={handleResizeStart('s')} />
            <div className="jodie-resize-handle w" onMouseDown={handleResizeStart('w')} />

            <JodieHeader
                activeProvider={activeProvider}
                onProviderChange={onProviderChange}
                onClose={onClose}
                onOpenSettings={onOpenSettings}
                onOpenDocumentation={onOpenDocumentation}
                isWaiting={isWaiting}
            />

            <ChatMessages messages={messages} isWaiting={isWaiting} />

            <ChatInput
                onSend={onSendMessage}
                disabled={isWaiting}
                supportsVision={supportsVision}
                supportsPDF={supportsPDF}
            />
        </div>
    );
}

export default JodieWindow;
