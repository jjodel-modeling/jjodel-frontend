/**
 * Chat Input Component
 * Text input for sending messages to the AI
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps): JSX.Element {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = () => {
        const trimmed = message.trim();
        if (trimmed && !disabled) {
            onSend(trimmed);
            setMessage('');
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="jodie-input-container">
            <textarea
                ref={textareaRef}
                className="jodie-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || 'Ask Jodie about metamodeling...'}
                disabled={disabled}
                rows={1}
            />
            <button
                className="jodie-send-btn"
                onClick={handleSubmit}
                disabled={disabled || !message.trim()}
                title="Send message"
            >
                <i className="bi bi-send-fill" />
            </button>
        </div>
    );
}

export default ChatInput;
