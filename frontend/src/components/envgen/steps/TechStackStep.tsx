import React from 'react';
import type { EnvGenTechStack } from '../types';
import {
    FRAMEWORK_OPTIONS,
    UI_LIBRARY_OPTIONS,
    ICON_LIBRARY_OPTIONS,
    BUILD_TOOL_OPTIONS,
    STATE_MANAGEMENT_OPTIONS,
    PERSISTENCE_OPTIONS,
} from '../types';

interface TechStackStepProps {
    techStack: EnvGenTechStack;
    setTechStack: (patch: Partial<EnvGenTechStack>) => void;
}

const renderSelect = (
    label: string,
    value: string,
    options: Array<{ value: string; label: string }>,
    onChange: (value: string) => void
) => (
    <div className="envgen-field">
        <label className="envgen-field-label">{label}</label>
        <select
            className="envgen-field-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

export const TechStackStep: React.FC<TechStackStepProps> = ({
    techStack,
    setTechStack,
}) => {
    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Tech Stack</h3>
                <p className="envgen-section-description">
                    Choose the technologies for the generated environment
                </p>
            </div>

            <div className="envgen-form-row">
                {renderSelect('Framework', techStack.framework, FRAMEWORK_OPTIONS, (v) => setTechStack({ framework: v }))}
                {renderSelect('UI Library', techStack.uiLibrary, UI_LIBRARY_OPTIONS, (v) => setTechStack({ uiLibrary: v }))}
            </div>

            <div className="envgen-form-row">
                {renderSelect('Icon Library', techStack.iconLibrary, ICON_LIBRARY_OPTIONS, (v) => setTechStack({ iconLibrary: v }))}
                {renderSelect('Build Tool', techStack.buildTool, BUILD_TOOL_OPTIONS, (v) => setTechStack({ buildTool: v }))}
            </div>

            <div className="envgen-form-row">
                {renderSelect('State Management', techStack.stateManagement, STATE_MANAGEMENT_OPTIONS, (v) => setTechStack({ stateManagement: v }))}
                {renderSelect('Persistence', techStack.persistence, PERSISTENCE_OPTIONS, (v) => setTechStack({ persistence: v }))}
            </div>
        </div>
    );
};
