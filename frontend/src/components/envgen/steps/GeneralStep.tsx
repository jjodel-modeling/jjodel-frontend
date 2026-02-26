import React from 'react';
import type { EnvGenGeneral, MetamodelInfo } from '../types';

interface GeneralStepProps {
    general: EnvGenGeneral;
    setGeneral: (patch: Partial<EnvGenGeneral>) => void;
    metamodels: Array<{ id: string; name: string }>;
    metamodelInfo: MetamodelInfo | null;
}

export const GeneralStep: React.FC<GeneralStepProps> = ({
    general,
    setGeneral,
    metamodels,
    metamodelInfo,
}) => {
    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">General</h3>
                <p className="envgen-section-description">
                    Basic configuration for your modeling environment
                </p>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-field">
                    <label className="envgen-field-label">Environment Name *</label>
                    <input
                        type="text"
                        className="envgen-field-input"
                        placeholder="e.g., ERD Studio"
                        value={general.name}
                        onChange={(e) => setGeneral({ name: e.target.value })}
                    />
                </div>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-field">
                    <label className="envgen-field-label">Description</label>
                    <input
                        type="text"
                        className="envgen-field-input"
                        placeholder="A brief description of the environment"
                        value={general.description}
                        onChange={(e) => setGeneral({ description: e.target.value })}
                    />
                </div>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-field">
                    <label className="envgen-field-label">Source Metamodel *</label>
                    <select
                        className="envgen-field-select"
                        value={general.metamodelId}
                        onChange={(e) => setGeneral({ metamodelId: e.target.value })}
                    >
                        <option value="">Select a metamodel...</option>
                        {metamodels.map((mm) => (
                            <option key={mm.id} value={mm.id}>
                                {mm.name || 'Unnamed'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {metamodelInfo && (
                <div className="envgen-info-box">
                    <i className="bi bi-info-circle envgen-info-box__icon" />
                    <div className="envgen-info-box__content">
                        <div className="envgen-info-box__title">{metamodelInfo.name}</div>
                        <div className="envgen-info-box__stats">
                            <span className="envgen-info-box__stat">
                                <strong>{metamodelInfo.classCount}</strong> classes
                            </span>
                            <span className="envgen-info-box__stat">
                                <strong>{metamodelInfo.enumCount}</strong> enumerations
                            </span>
                            <span className="envgen-info-box__stat">
                                <strong>{metamodelInfo.referenceCount}</strong> references
                            </span>
                            <span className="envgen-info-box__stat">
                                <strong>{metamodelInfo.attributeCount}</strong> attributes
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
