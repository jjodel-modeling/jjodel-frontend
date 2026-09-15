/**
 * MappingAnalysisProgressModal
 *
 * Multi-step progress UI for the AI-backed mapping analysis pipeline, mounted
 * by SuggestedMappingsPanel while `mappingSuggestionService.analyze` runs in
 * 'ai' mode. Mirrors the visual language of DocumentationTab's GenerationProgressModal
 * (conscious duplication — the two surfaces evolve independently).
 *
 * Contract:
 * - Not closable while running (overlay click + close button both disabled).
 * - Closable on completion OR error.
 * - One step per real AI-pipeline phase (see MappingAnalysisStep in types/suggestions).
 */

import React from 'react';
import './MappingAnalysisProgressModal.scss';
import { MappingAnalysisStepEntry } from '../types/suggestions';

export interface MappingAnalysisProgressModalProps {
    isOpen: boolean;
    steps: MappingAnalysisStepEntry[];
    onClose: () => void;
    /** True when every step is 'completed' or 'error'. Enables the Close button + overlay click. */
    isComplete: boolean;
}

export const MappingAnalysisProgressModal: React.FC<MappingAnalysisProgressModalProps> = ({
    isOpen,
    steps,
    onClose,
    isComplete,
}) => {
    if (!isOpen) return null;

    const hasError = steps.some(s => s.status === 'error');
    const canClose = isComplete || hasError;

    const headerIcon = isComplete && !hasError
        ? 'bi-check-circle-fill'
        : hasError
            ? 'bi-x-circle-fill'
            : 'bi-stars';

    const headerText = isComplete && !hasError
        ? 'Analysis Complete'
        : hasError
            ? 'Analysis Failed'
            : 'Analyzing Metamodels...';

    return (
        <div
            className="mapping-analysis-progress-overlay"
            onClick={canClose ? onClose : undefined}
        >
            <div className="mapping-analysis-progress-modal" onClick={e => e.stopPropagation()}>
                <div className="progress-modal-header">
                    <div className="progress-title">
                        <i className={`bi ${headerIcon}`} />
                        <span>{headerText}</span>
                    </div>
                </div>

                <div className="progress-steps">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`progress-step ${step.status}`}
                        >
                            <div className="step-indicator">
                                {step.status === 'completed' && <i className="bi bi-check-lg" />}
                                {step.status === 'running' && <div className="spinner" />}
                                {step.status === 'pending' && <span className="step-number">{index + 1}</span>}
                                {step.status === 'error' && <i className="bi bi-x-lg" />}
                            </div>
                            <div className="step-content">
                                <div className="step-label">{step.label}</div>
                                {step.detail && (
                                    <div className="step-detail">{step.detail}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="progress-footer">
                    <button
                        className="progress-close-btn"
                        onClick={onClose}
                        disabled={!canClose}
                    >
                        {canClose ? 'Close' : 'Please wait...'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MappingAnalysisProgressModal;
