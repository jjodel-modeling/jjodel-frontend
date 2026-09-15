import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ENVGEN_NAV_GROUPS, STEP_ORDER, EnvGenStepId, EnvGenConfig } from './types';
import { useEnvGenWizard, MetamodelOption } from './hooks/useEnvGenWizard';
import { GeneralStep } from './steps/GeneralStep';
import { TechStackStep } from './steps/TechStackStep';
import { DesignStep } from './steps/DesignStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ConcreteSyntaxStep } from './steps/ConcreteSyntaxStep';
import { OutputStep } from './steps/OutputStep';
import './EnvGenWizardModal.scss';

export interface EnvGenWizardModalProps {
    isOpen: boolean;
    onClose: () => void;
    metamodels: MetamodelOption[];
    existingConfigId?: string;
    onConfigSaved?: (config: EnvGenConfig) => void;
}

export const EnvGenWizardModal: React.FC<EnvGenWizardModalProps> = ({
    isOpen,
    onClose,
    metamodels,
    existingConfigId,
    onConfigSaved,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const wizard = useEnvGenWizard(metamodels, existingConfigId);

    // Animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsAnimating(true));
            });
            document.body.style.overflow = 'hidden';
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 200);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    const handleExportPrompt = useCallback(() => {
        wizard.exportPromptFile();
        if (onConfigSaved) {
            const config = wizard.saveConfig();
            onConfigSaved(config);
        }
    }, [wizard, onConfigSaved]);

    const handleGenerate = useCallback(() => {
        if (wizard.output.provider === 'manual') {
            handleExportPrompt();
            return;
        }
        // For API providers, show placeholder and export
        alert('Direct generation via API will be available in a future release. For now, export the prompt and use it with Claude Code in VS Code.');
        handleExportPrompt();
    }, [wizard.output.provider, handleExportPrompt]);

    const handleSaveAndClose = useCallback(() => {
        wizard.saveConfig();
        if (onConfigSaved) {
            const config = wizard.saveConfig();
            onConfigSaved(config);
        }
        onClose();
    }, [wizard, onConfigSaved, onClose]);

    if (!isVisible) return null;

    const renderStepContent = () => {
        switch (wizard.currentStep) {
            case 'general':
                return (
                    <GeneralStep
                        general={wizard.general}
                        setGeneral={wizard.setGeneral}
                        metamodels={metamodels}
                        metamodelInfo={wizard.metamodelInfo}
                    />
                );
            case 'tech-stack':
                return (
                    <TechStackStep
                        techStack={wizard.techStack}
                        setTechStack={wizard.setTechStack}
                    />
                );
            case 'design':
                return (
                    <DesignStep
                        design={wizard.design}
                        setDesign={wizard.setDesign}
                    />
                );
            case 'features':
                return (
                    <FeaturesStep
                        features={wizard.features}
                        setFeatures={wizard.setFeatures}
                    />
                );
            case 'concrete-syntax':
                return (
                    <ConcreteSyntaxStep
                        concreteSyntax={wizard.concreteSyntax}
                        setConcreteSyntax={wizard.setConcreteSyntax}
                        metamodelId={wizard.general.metamodelId}
                    />
                );
            case 'output':
                return (
                    <OutputStep
                        output={wizard.output}
                        setOutput={wizard.setOutput}
                        promptPreview={wizard.promptPreview}
                    />
                );
            default:
                return null;
        }
    };

    const getStepStatus = (stepId: EnvGenStepId): 'completed' | 'active' | 'pending' => {
        const stepIndex = STEP_ORDER.indexOf(stepId);
        if (stepId === wizard.currentStep) return 'active';
        if (stepIndex < wizard.currentStepIndex) return 'completed';
        return 'pending';
    };

    return ReactDOM.createPortal(
        <div
            className={`envgen-backdrop ${isAnimating ? 'visible' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`envgen-modal ${isAnimating ? 'visible' : ''}`}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="envgen-modal-title"
            >
                {/* Header */}
                <div className="envgen-header">
                    <div className="envgen-header__left">
                        <i className="bi bi-box-seam envgen-header__icon" />
                        <div>
                            <h2 id="envgen-modal-title" className="envgen-header__title">Generate Environment</h2>
                            <p className="envgen-header__subtitle">
                                Configure and generate a standalone modeling environment from your metamodel
                            </p>
                        </div>
                    </div>
                    <button className="envgen-close" onClick={handleSaveAndClose} title="Save and close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="envgen-body">
                    {/* Sidebar */}
                    <nav className="envgen-sidebar">
                        {ENVGEN_NAV_GROUPS.map(group => (
                            <div className="envgen-nav-group" key={group.label}>
                                <div className="envgen-nav-group-label">{group.label}</div>
                                {group.items.map(item => {
                                    const status = getStepStatus(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            className={`envgen-nav-item ${status === 'active' ? 'active' : ''}`}
                                            onClick={() => wizard.setStep(item.id)}
                                        >
                                            <span className={`envgen-nav-step-indicator envgen-nav-step-indicator--${status}`}>
                                                {status === 'completed' && <i className="bi bi-check" />}
                                                {status === 'active' && <span className="envgen-nav-step-indicator__dot" />}
                                            </span>
                                            <i className={`bi ${item.icon}`} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Content */}
                    <div className="envgen-content">
                        {renderStepContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="envgen-footer">
                    <div className="envgen-footer__left">
                        {wizard.canGoBack && (
                            <button className="envgen-btn envgen-btn--secondary" onClick={wizard.goBack}>
                                <i className="bi bi-arrow-left" /> Back
                            </button>
                        )}
                    </div>

                    <div className="envgen-step-dots">
                        {STEP_ORDER.map((stepId, i) => (
                            <button
                                key={stepId}
                                className={`envgen-step-dot ${
                                    stepId === wizard.currentStep ? 'envgen-step-dot--active' :
                                    i < wizard.currentStepIndex ? 'envgen-step-dot--completed' : ''
                                }`}
                                onClick={() => wizard.setStep(stepId)}
                                title={stepId}
                            />
                        ))}
                    </div>

                    <div className="envgen-footer__right">
                        {wizard.isLastStep ? (
                            <>
                                <button className="envgen-btn envgen-btn--secondary" onClick={handleExportPrompt}>
                                    Export Prompt
                                </button>
                                <button className="envgen-btn envgen-btn--primary" onClick={handleGenerate}>
                                    <i className="bi bi-rocket-takeoff" /> Generate
                                </button>
                            </>
                        ) : (
                            <button className="envgen-btn envgen-btn--primary" onClick={wizard.goNext}>
                                Next <i className="bi bi-arrow-right" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
