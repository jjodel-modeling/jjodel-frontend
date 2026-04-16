/**
 * ExecuteTransformationDialog Component
 * Dialog for executing a JjTL transformation with source model selection
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../components/common/Button';
import '../../components/CreateProjectDialog/create-project-dialog.scss';
import './execute-transformation-dialog.scss';

export interface ModelOption {
    id: string;
    name: string;
    metamodelId: string;
    metamodelName: string;
    // Allow additional fields for flexibility
    conformsTo?: string;
    metamodel?: { id?: string; name?: string } | string;
}

export interface ExecuteTransformationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (sourceModelId: string, outputModelName: string) => Promise<void>;
    transformationName: string;
    sourceMetamodelName: string;
    targetMetamodelName: string;
    /** All available models in the project */
    availableModels: ModelOption[];
    /** Existing model names to avoid duplicates */
    existingModelNames: string[];
}

export const ExecuteTransformationDialog: React.FC<ExecuteTransformationDialogProps> = ({
    isOpen,
    onClose,
    onExecute,
    transformationName,
    sourceMetamodelName,
    targetMetamodelName,
    availableModels,
    existingModelNames,
}) => {
    const [sourceModelId, setSourceModelId] = useState('');
    const [outputModelName, setOutputModelName] = useState('');
    const [errors, setErrors] = useState<{ source?: string; output?: string }>({});
    const [isExecuting, setIsExecuting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    // Filter models that conform to the source metamodel
    // Uses robust matching that tries multiple possible field names
    const compatibleModels = useMemo(() => {
        if (!availableModels || availableModels.length === 0) {
            if (isOpen) {
                // console.log('[ExecuteTransformationDialog] No models available');
            }
            return [];
        }

        // Debug: log what we're looking for
        if (isOpen) {
            // console.log('[ExecuteTransformationDialog] Filtering models...', {
            //     sourceMetamodelName,
            //     totalModels: availableModels.length,
            // });
        }

        const filtered = availableModels.filter(model => {
            // Try to get metamodel ID from various possible fields
            const mmId = model.metamodelId
                || model.conformsTo
                || (typeof model.metamodel === 'string' ? model.metamodel : model.metamodel?.id)
                || '';

            // Try to get metamodel name from various possible fields
            const mmName = model.metamodelName
                || (typeof model.metamodel === 'object' ? model.metamodel?.name : '')
                || '';

            // Match by name (primary) or by ID if name is empty
            const matchesByName = mmName && mmName === sourceMetamodelName;
            const matchesById = mmId && mmId === sourceMetamodelName; // In case sourceMetamodelName is actually an ID

            const matches = matchesByName || matchesById;

            // Debug: log each model's matching result
            if (isOpen) {
                // console.log(`[ExecuteTransformationDialog] Model "${model.name}":`, {
                //     metamodelId: mmId || '(empty)',
                //     metamodelName: mmName || '(empty)',
                //     lookingFor: sourceMetamodelName,
                //     matchesByName,
                //     matchesById,
                //     matches,
                // });
            }

            return matches;
        });

        if (isOpen) {
            // console.log('[ExecuteTransformationDialog] Result:', {
            //     compatibleCount: filtered.length,
            //     compatibleModels: filtered.map(m => m.name),
            // });
        }

        return filtered;
    }, [availableModels, sourceMetamodelName, isOpen]);

    // Generate default output name
    const generateDefaultOutputName = (): string => {
        const baseName = `${sourceMetamodelName}_to_${targetMetamodelName}`;
        let name = baseName;
        let counter = 1;
        while (existingModelNames.includes(name)) {
            name = `${baseName}_${counter}`;
            counter++;
        }
        return name;
    };

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            // Dialog just opened - initialize form
            setSourceModelId(compatibleModels.length > 0 ? compatibleModels[0].id : '');
            setOutputModelName(generateDefaultOutputName());
            setErrors({});
            setIsExecuting(false);

            // Focus output name input after a short delay
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, compatibleModels.length]);

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

    const validate = (): boolean => {
        const newErrors: typeof errors = {};

        if (!sourceModelId) {
            newErrors.source = 'Select a source model';
        }

        if (!outputModelName.trim()) {
            newErrors.output = 'Output model name is required';
        } else if (existingModelNames.includes(outputModelName.trim())) {
            newErrors.output = 'A model with this name already exists';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // console.log('[ExecuteTransformationDialog] handleSubmit called');

        if (!validate()) {
            // console.log('[ExecuteTransformationDialog] Validation failed');
            return;
        }

        setIsExecuting(true);
        // console.log('[ExecuteTransformationDialog] Calling onExecute with:', { sourceModelId, outputModelName: outputModelName.trim() });

        try {
            await onExecute(sourceModelId, outputModelName.trim());
            // console.log('[ExecuteTransformationDialog] onExecute completed successfully');
            // Reset and close on success
            setSourceModelId('');
            setOutputModelName('');
            setErrors({});
            onClose();
        } catch (error) {
            console.error('[ExecuteTransformationDialog] Error executing transformation:', error);
            setIsExecuting(false);
        }
    };

    const handleCancel = () => {
        setSourceModelId('');
        setOutputModelName('');
        setErrors({});
        setIsExecuting(false);
        onClose();
    };

    // Handle overlay click - only close if clicking directly on overlay
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    const noCompatibleModels = compatibleModels.length === 0;

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div className="dialog-content dialog-content--execute" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon execute-icon">
                        <i className="bi bi-play-fill" />
                    </div>
                    <h2>Execute Transformation</h2>
                    <button className="dialog-close" onClick={handleCancel} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Transformation Info */}
                <div className="execute-info">
                    <div className="execute-info-row">
                        <span className="execute-info-label">Transformation:</span>
                        <span className="execute-info-value">{transformationName}</span>
                    </div>
                    <div className="execute-info-row execute-info-metamodels">
                        <span className="execute-metamodel source">
                            <i className="bi bi-box" />
                            {sourceMetamodelName}
                        </span>
                        <i className="bi bi-arrow-right execute-arrow" />
                        <span className="execute-metamodel target">
                            <i className="bi bi-box" />
                            {targetMetamodelName}
                        </span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        {noCompatibleModels ? (
                            <div className="dialog-warning">
                                <i className="bi bi-exclamation-triangle" />
                                <div>
                                    <strong>No compatible models</strong>
                                    <p>
                                        No models conforming to "{sourceMetamodelName}" were found.
                                        Create a model instance of the source metamodel before executing this transformation.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Source Model Selection */}
                                <div className="form-group">
                                    <label htmlFor="source-model">
                                        Source Model <span className="required">*</span>
                                    </label>
                                    <p className="form-hint">
                                        Select an instance of <strong>{sourceMetamodelName}</strong> to transform
                                    </p>
                                    <select
                                        id="source-model"
                                        className={`form-select ${errors.source ? 'error' : ''}`}
                                        value={sourceModelId}
                                        onChange={(e) => {
                                            setSourceModelId(e.target.value);
                                            if (errors.source) setErrors({ ...errors, source: undefined });
                                        }}
                                        disabled={isExecuting}
                                    >
                                        <option value="">Select source model...</option>
                                        {compatibleModels.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.source && <span className="error-message">{errors.source}</span>}
                                    <span className="form-count">
                                        {compatibleModels.length} model{compatibleModels.length !== 1 ? 's' : ''} available
                                    </span>
                                </div>

                                {/* Output Model Name */}
                                <div className="form-group">
                                    <label htmlFor="output-model-name">
                                        Output Model Name <span className="required">*</span>
                                    </label>
                                    <p className="form-hint">
                                        Name for the generated <strong>{targetMetamodelName}</strong> instance
                                    </p>
                                    <input
                                        ref={inputRef}
                                        id="output-model-name"
                                        type="text"
                                        className={`form-input ${errors.output ? 'error' : ''}`}
                                        placeholder="e.g., MyTransformedModel"
                                        value={outputModelName}
                                        onChange={(e) => {
                                            setOutputModelName(e.target.value);
                                            if (errors.output) setErrors({ ...errors, output: undefined });
                                        }}
                                        disabled={isExecuting}
                                    />
                                    {errors.output && <span className="error-message">{errors.output}</span>}
                                </div>

                                {/* Execution Preview */}
                                <div className="execute-preview">
                                    <div className="execute-preview-title">
                                        <i className="bi bi-info-circle" />
                                        Execution Preview
                                    </div>
                                    <div className="execute-preview-content">
                                        <div className="execute-preview-item">
                                            <span className="execute-preview-label">Input:</span>
                                            <span className="execute-preview-value source">
                                                {sourceModelId ?
                                                    compatibleModels.find(m => m.id === sourceModelId)?.name || 'Unknown'
                                                    : '—'}
                                            </span>
                                        </div>
                                        <i className="bi bi-arrow-right" />
                                        <div className="execute-preview-item">
                                            <span className="execute-preview-label">Output:</span>
                                            <span className="execute-preview-value target">
                                                {outputModelName || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="dialog-footer">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                            disabled={isExecuting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="btn-execute"
                            disabled={isExecuting || noCompatibleModels}
                        >
                            {isExecuting ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-play-fill" />
                                    Execute Transformation
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExecuteTransformationDialog;
