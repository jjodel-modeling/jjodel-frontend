/**
 * Editor V3 — InlineEditor: overlay input for editing node fields in-place.
 *
 * Renders an absolutely-positioned input that appears on double-click.
 * Commits on Enter or blur, cancels on Escape.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface InlineEditorProps {
    /** Current value to edit */
    value: string;
    /** Called when editing is committed (Enter or blur) */
    onCommit: (newValue: string) => void;
    /** Called when editing is cancelled (Escape) */
    onCancel: () => void;
    /** CSS class for styling */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Select all text on mount */
    selectAll?: boolean;
}

export function InlineEditor({
    value,
    onCommit,
    onCancel,
    className = '',
    placeholder = '',
    selectAll = true,
}: InlineEditorProps) {
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const input = inputRef.current;
        if (input) {
            input.focus();
            if (selectAll) {
                input.select();
            }
        }
    }, [selectAll]);

    const handleCommit = useCallback(() => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== value) {
            onCommit(trimmed);
        } else {
            onCancel();
        }
    }, [editValue, value, onCommit, onCancel]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
        // Stop propagation to prevent React Flow shortcuts
        e.stopPropagation();
    }, [handleCommit, onCancel]);

    return (
        <input
            ref={inputRef}
            className={`v3-inline-editor ${className}`}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            // Prevent drag from starting when clicking inside the input
            onMouseDown={e => e.stopPropagation()}
        />
    );
}
