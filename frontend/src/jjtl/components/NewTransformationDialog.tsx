/**
 * NewTransformationDialog Component
 * Dialog for creating a new JjTL transformation
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TransformationFormData, generateUniqueName } from '../types/transformation';
import { Button } from '../../components/common/Button';
import '../../components/CreateProjectDialog/create-project-dialog.scss';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitizes a string to be a valid JjTL identifier
 * Removes/replaces invalid characters, keeps only letters, numbers, and underscores
 * "Activity Diagrams" → "Activity_Diagrams"
 * "petri-nets" → "petri_nets"
 * "my_metamodel" → "my_metamodel"
 */
function sanitizeForJjtl(str: string): string {
    if (!str) return '';

    return str
        // Replace spaces, dashes, and other invalid chars with underscore
        .replace(/[^a-zA-Z0-9_]/g, '_')
        // Remove consecutive underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_|_$/g, '')
        // Ensure it starts with a letter (prepend 'T' if it starts with number)
        .replace(/^(\d)/, 'T$1');
}

/**
 * Generates a transformation name from metamodel names
 * Uses "_to_" separator which is valid in JjTL syntax
 * "Activity Diagrams" + "Petri Nets" → "Activity_Diagrams_to_Petri_Nets"
 */
function generateTransformationNameFromMetamodels(sourceName: string, targetName: string): string {
    if (!sourceName || !targetName) {
        return 'Transformation';
    }

    const source = sanitizeForJjtl(sourceName);
    const target = sanitizeForJjtl(targetName);

    return `${source}_to_${target}`;
}

// ============================================
// INTERFACES
// ============================================

interface MetamodelOption {
    id: string;
    name: string;
}

interface NewTransformationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TransformationFormData) => void;
    metamodels: MetamodelOption[];
    existingNames: string[];
}

export const NewTransformationDialog: React.FC<NewTransformationDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    metamodels,
    existingNames,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sourceMetamodelId, setSourceMetamodelId] = useState('');
    const [targetMetamodelId, setTargetMetamodelId] = useState('');
    const [errors, setErrors] = useState<{ name?: string; source?: string; target?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    // Get selected metamodel objects
    const sourceMetamodel = useMemo(
        () => metamodels.find(m => m.id === sourceMetamodelId),
        [metamodels, sourceMetamodelId]
    );
    const targetMetamodel = useMemo(
        () => metamodels.find(m => m.id === targetMetamodelId),
        [metamodels, targetMetamodelId]
    );

    // Reset form ONLY when dialog opens (transition from closed to open)
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            // Dialog just opened - initialize form
            setName('');
            setDescription('');
            setSourceMetamodelId('');
            setTargetMetamodelId('');
            setErrors({});
            setIsNameManuallyEdited(false);

            // Focus input after a short delay
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen]); // Only depend on isOpen, not on metamodels/existingNames

    // Auto-generate name when source or target metamodel changes
    useEffect(() => {
        // Only auto-generate if user hasn't manually edited the name
        if (!isNameManuallyEdited && isOpen) {
            const sourceName = sourceMetamodel?.name || '';
            const targetName = targetMetamodel?.name || '';

            if (sourceName && targetName) {
                // Generate name from metamodel names
                let generatedName = generateTransformationNameFromMetamodels(sourceName, targetName);

                // Make sure it's unique
                generatedName = generateUniqueName(generatedName, existingNames);

                setName(generatedName);
            } else if (!sourceName && !targetName) {
                // Both empty - clear name
                setName('');
            }
            // If only one is selected, keep the current name (or empty)
        }
    }, [sourceMetamodelId, targetMetamodelId, sourceMetamodel, targetMetamodel, isNameManuallyEdited, isOpen, existingNames]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    /**
     * Checks if a name is a valid JjTL identifier
     * Must start with letter or underscore, contain only letters/numbers/underscores
     */
    const isValidJjtlIdentifier = (name: string): boolean => {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    };

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = 'Transformation name is required';
        } else if (!isValidJjtlIdentifier(name.trim())) {
            newErrors.name = 'Name can only contain letters, numbers, and underscores (no spaces or dashes)';
        } else if (existingNames.includes(name.trim())) {
            newErrors.name = 'A transformation with this name already exists';
        }

        if (!sourceMetamodelId) {
            newErrors.source = 'Select a source metamodel';
        }

        if (!targetMetamodelId) {
            newErrors.target = 'Select a target metamodel';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                sourceMetamodelId,
                targetMetamodelId,
            });

            // Reset form on success
            setName('');
            setDescription('');
            setSourceMetamodelId('');
            setTargetMetamodelId('');
            setErrors({});
        } catch (error) {
            console.error('Error creating transformation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setName('');
        setDescription('');
        setSourceMetamodelId('');
        setTargetMetamodelId('');
        setErrors({});
        onClose();
    };

    // Handle overlay click - only close if clicking directly on overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    const noMetamodels = metamodels.length === 0;

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div className="dialog-content dialog-content--transformation" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon">
                        <i className="bi bi-arrow-left-right" />
                    </div>
                    <h2>New Transformation</h2>
                    <button className="dialog-close" onClick={handleCancel} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        {noMetamodels ? (
                            <div className="dialog-warning">
                                <i className="bi bi-exclamation-triangle" />
                                <div>
                                    <strong>No metamodels available</strong>
                                    <p>Create at least one metamodel before creating a transformation.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Transformation Name */}
                                <div className="form-group">
                                    <label htmlFor="transformation-name">
                                        Name <span className="required">*</span>
                                    </label>
                                    <input
                                        ref={inputRef}
                                        id="transformation-name"
                                        type="text"
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        placeholder="e.g., StateMachine_to_PetriNet"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setIsNameManuallyEdited(true); // User took control
                                            if (errors.name) setErrors({ ...errors, name: undefined });
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    {errors.name && <span className="error-message">{errors.name}</span>}
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label htmlFor="transformation-description">Description</label>
                                    <textarea
                                        id="transformation-description"
                                        className="form-textarea"
                                        placeholder="Brief description of what this transformation does"
                                        rows={2}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Metamodel Selection */}
                                <div className="form-group-row">
                                    {/* Source Metamodel */}
                                    <div className="form-group form-group--half">
                                        <label htmlFor="source-metamodel">
                                            Source Metamodel <span className="required">*</span>
                                        </label>
                                        <select
                                            id="source-metamodel"
                                            className={`form-select ${errors.source ? 'error' : ''}`}
                                            value={sourceMetamodelId}
                                            onChange={(e) => {
                                                setSourceMetamodelId(e.target.value);
                                                if (errors.source) setErrors({ ...errors, source: undefined });
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select source...</option>
                                            {metamodels.map((mm) => (
                                                <option key={mm.id} value={mm.id}>
                                                    {mm.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.source && <span className="error-message">{errors.source}</span>}
                                    </div>

                                    {/* Arrow indicator */}
                                    <div className="form-arrow">
                                        <i className="bi bi-arrow-right" />
                                    </div>

                                    {/* Target Metamodel */}
                                    <div className="form-group form-group--half">
                                        <label htmlFor="target-metamodel">
                                            Target Metamodel <span className="required">*</span>
                                        </label>
                                        <select
                                            id="target-metamodel"
                                            className={`form-select ${errors.target ? 'error' : ''}`}
                                            value={targetMetamodelId}
                                            onChange={(e) => {
                                                setTargetMetamodelId(e.target.value);
                                                if (errors.target) setErrors({ ...errors, target: undefined });
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select target...</option>
                                            {metamodels.map((mm) => (
                                                <option key={mm.id} value={mm.id}>
                                                    {mm.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.target && <span className="error-message">{errors.target}</span>}
                                    </div>
                                </div>

                                {/* Same metamodel warning */}
                                {sourceMetamodelId &&
                                 targetMetamodelId &&
                                 sourceMetamodelId === targetMetamodelId && (
                                    <div className="form-hint form-hint--warning">
                                        <i className="bi bi-info-circle" />
                                        Source and target are the same metamodel. This creates an in-place transformation.
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="dialog-footer">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting || noMetamodels}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-plus-lg" />
                                    Create Transformation
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewTransformationDialog;
