import React from 'react';
import type { EnvGenGeneral } from '../types';

interface GeneralStepProps {
    general: EnvGenGeneral;
    setGeneral: (patch: Partial<EnvGenGeneral>) => void;
}

export const GeneralStep: React.FC<GeneralStepProps> = ({
    general,
    setGeneral,
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
        </div>
    );
};
