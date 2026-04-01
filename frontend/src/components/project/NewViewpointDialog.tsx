import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import type { ViewpointType } from '../../joiner';
import '../CreateProjectDialog/create-project-dialog.scss';

const VIEWPOINT_TYPES: { value: ViewpointType; label: string; description: string }[] = [
    { value: 'syntax', label: 'Syntax', description: 'Exclusive view — defines the concrete syntax of a model' },
    { value: 'decoration', label: 'Decoration', description: 'Overlay — adds visual decorations to existing views' },
    { value: 'validation', label: 'Validation', description: 'Overlay — highlights validation errors and warnings' },
    { value: 'semantics', label: 'Semantics', description: 'Overlay — shows semantic information' },
    { value: 'editor_behavior', label: 'Editor behavior', description: 'Overlay — customizes editor interactions' },
];

interface NewViewpointDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; type: ViewpointType }) => void;
    existingNames: string[];
}

export const NewViewpointDialog: React.FC<NewViewpointDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    existingNames,
}) => {
    const [name, setName] = useState('');
    const [vpType, setVpType] = useState<ViewpointType>('decoration');
    const [errors, setErrors] = useState<{ name?: string }>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setName('');
            setVpType('decoration');
            setErrors({});
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) handleCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        const trimmed = name.trim();
        if (!trimmed) {
            newErrors.name = 'Viewpoint name is required';
        } else if (existingNames.includes(trimmed)) {
            newErrors.name = 'A viewpoint with this name already exists';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ name: name.trim(), type: vpType });
    };

    const handleCancel = () => {
        setName('');
        setVpType('decoration');
        setErrors({});
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleCancel();
    };

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon">
                        <i className="bi bi-eye" />
                    </div>
                    <h2>New Viewpoint</h2>
                    <button className="dialog-close" onClick={handleCancel} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        {/* Name */}
                        <div className="form-group">
                            <label htmlFor="viewpoint-name">
                                Name <span className="required">*</span>
                            </label>
                            <input
                                ref={inputRef}
                                id="viewpoint-name"
                                type="text"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                placeholder="e.g., Custom Syntax"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({});
                                }}
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        {/* Type */}
                        <div className="form-group">
                            <label htmlFor="viewpoint-type">Type</label>
                            <select
                                id="viewpoint-type"
                                className="form-select"
                                value={vpType}
                                onChange={(e) => setVpType(e.target.value as ViewpointType)}
                            >
                                {VIEWPOINT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <span className="form-hint">
                                {VIEWPOINT_TYPES.find(t => t.value === vpType)?.description}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="dialog-footer">
                        <Button variant="secondary" type="button" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            <i className="bi bi-plus-lg" />
                            Create Viewpoint
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewViewpointDialog;
