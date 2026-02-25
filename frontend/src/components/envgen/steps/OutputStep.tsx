import React from 'react';
import type { EnvGenOutput } from '../types';
import {
    OUTPUT_FORMAT_OPTIONS,
    GENERATION_PROVIDER_OPTIONS,
} from '../types';

interface OutputStepProps {
    output: EnvGenOutput;
    setOutput: (patch: Partial<EnvGenOutput>) => void;
    promptPreview: string;
}

export const OutputStep: React.FC<OutputStepProps> = ({
    output,
    setOutput,
    promptPreview,
}) => {
    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Output</h3>
                <p className="envgen-section-description">
                    Choose the output format and review the generated prompt
                </p>
            </div>

            <div className="envgen-form-row">
                <div className="envgen-field">
                    <label className="envgen-field-label">Output Format</label>
                    <select
                        className="envgen-field-select"
                        value={output.format}
                        onChange={(e) => setOutput({ format: e.target.value })}
                    >
                        {OUTPUT_FORMAT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="envgen-field">
                    <label className="envgen-field-label">Generation Provider</label>
                    <select
                        className="envgen-field-select"
                        value={output.provider}
                        onChange={(e) => setOutput({ provider: e.target.value })}
                    >
                        {GENERATION_PROVIDER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-feature-item">
                    <span className="envgen-feature-label">Include sample data</span>
                    <button
                        type="button"
                        className={`envgen-toggle ${output.includeSampleData ? 'active' : ''}`}
                        onClick={() => setOutput({ includeSampleData: !output.includeSampleData })}
                    />
                </div>
                <div className="envgen-feature-item">
                    <span className="envgen-feature-label">Include documentation comments</span>
                    <button
                        type="button"
                        className={`envgen-toggle ${output.includeDocComments ? 'active' : ''}`}
                        onClick={() => setOutput({ includeDocComments: !output.includeDocComments })}
                    />
                </div>
            </div>

            <div className="envgen-field" style={{ marginTop: '16px' }}>
                <label className="envgen-field-label">Prompt Preview</label>
                <div className="envgen-prompt-preview">
                    {promptPreview}
                </div>
            </div>
        </div>
    );
};
