import React, { useState, useRef, useEffect, useCallback } from 'react';
import './add-tag-dialog.scss';

interface AddTagDialogProps {
    isOpen: boolean;
    projectCount: number;
    existingTags?: string[];
    onConfirm: (tagName: string) => void;
    onCancel: () => void;
}

/**
 * AddTagDialog - Custom modal for adding tags to projects
 *
 * Replaces native window.prompt() with a styled modal
 * that matches the Jjodel design system.
 */
export const AddTagDialog: React.FC<AddTagDialogProps> = ({
    isOpen,
    projectCount,
    existingTags = [],
    onConfirm,
    onCancel
}) => {
    const [tagName, setTagName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
        if (!isOpen) {
            setTagName('');
        }
    }, [isOpen]);

    // Handle ESC key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    }, [onCancel]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagName.trim()) {
            onConfirm(tagName.trim().toLowerCase());
            setTagName('');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="add-tag-dialog-backdrop"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="add-tag-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-tag-dialog-title"
            >
                <form onSubmit={handleSubmit}>
                    {/* Icon */}
                    <div className="add-tag-dialog-icon">
                        <i className="bi bi-tag" />
                    </div>

                    {/* Title */}
                    <h2 id="add-tag-dialog-title" className="add-tag-dialog-title">
                        Add Tag
                    </h2>

                    {/* Subtitle */}
                    <p className="add-tag-dialog-subtitle">
                        Add tag to {projectCount} selected project{projectCount > 1 ? 's' : ''}
                    </p>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        className="add-tag-dialog-input"
                        placeholder="Enter tag name..."
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        autoComplete="off"
                    />

                    {/* Existing tags hint */}
                    {existingTags.length > 0 && (
                        <div className="add-tag-dialog-suggestions">
                            <span className="suggestions-label">Existing tags:</span>
                            <div className="suggestions-list">
                                {existingTags.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className="suggestion-tag"
                                        onClick={() => setTagName(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="add-tag-dialog-actions">
                        <button
                            type="button"
                            className="add-tag-dialog-btn add-tag-dialog-btn--secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="add-tag-dialog-btn add-tag-dialog-btn--primary"
                            disabled={!tagName.trim()}
                        >
                            Add Tag
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default AddTagDialog;
