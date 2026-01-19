/**
 * Jodie Window Component
 * Draggable, resizable chat window
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JodieHeader } from './JodieHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AIProvider, ChatMessage } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';

interface JodieWindowProps {
    messages: ChatMessage[];
    activeProvider: AIProvider;
    isWaiting: boolean;
    onSendMessage: (message: string) => void;
    onProviderChange: (provider: AIProvider) => void;
    onMinimize: () => void;
    onClose: () => void;
    onOpenSettings: () => void;
}

interface Position {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

const DEFAULT_SIZE: Size = { width: 380, height: 520 };
const MIN_SIZE: Size = { width: 320, height: 400 };

export function JodieWindow({
    messages,
    activeProvider,
    isWaiting,
    onSendMessage,
    onProviderChange,
    onMinimize,
    onClose,
    onOpenSettings,
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
    const [isResizing, setIsResizing] = useState(false);

    const windowRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef<Position>({ x: 0, y: 0 });

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
        if ((e.target as HTMLElement).closest('.jodie-header')) {
            setIsDragging(true);
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        }
    };

    // Handle resize
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        dragOffset.current = {
            x: e.clientX,
            y: e.clientY,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - size.width));
                const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - size.height));
                setPosition({ x: newX, y: newY });
            } else if (isResizing) {
                const deltaX = e.clientX - dragOffset.current.x;
                const deltaY = e.clientY - dragOffset.current.y;

                const newWidth = Math.max(MIN_SIZE.width, size.width - deltaX);
                const newHeight = Math.max(MIN_SIZE.height, size.height - deltaY);

                setSize({ width: newWidth, height: newHeight });
                setPosition({
                    x: position.x + (size.width - newWidth),
                    y: position.y + (size.height - newHeight),
                });

                dragOffset.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                savePosition(position);
            }
            if (isResizing) {
                setIsResizing(false);
                saveSize(size);
            }
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, position, size, savePosition, saveSize]);

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
            className={`jodie-window ${isDragging ? 'jodie-dragging' : ''}`}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="jodie-resize-handle" onMouseDown={handleResizeMouseDown} />

            <JodieHeader
                activeProvider={activeProvider}
                onProviderChange={onProviderChange}
                onMinimize={onMinimize}
                onClose={onClose}
                onOpenSettings={onOpenSettings}
                isWaiting={isWaiting}
            />

            <ChatMessages messages={messages} isWaiting={isWaiting} />

            <ChatInput
                onSend={onSendMessage}
                disabled={isWaiting}
            />
        </div>
    );
}

export default JodieWindow;
