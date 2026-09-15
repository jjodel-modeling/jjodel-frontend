import React from 'react';
import type { EnvGenDesign } from '../types';
import {
    STYLE_REFERENCE_OPTIONS,
    THEME_OPTIONS,
    ACCENT_COLORS,
    FONT_SIZE_OPTIONS,
    BORDER_RADIUS_OPTIONS,
    DENSITY_OPTIONS,
} from '../types';

interface DesignStepProps {
    design: EnvGenDesign;
    setDesign: (patch: Partial<EnvGenDesign>) => void;
}

export const DesignStep: React.FC<DesignStepProps> = ({
    design,
    setDesign,
}) => {
    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Design & UI</h3>
                <p className="envgen-section-description">
                    Customize the look and feel of the generated environment
                </p>
            </div>

            <div className="envgen-form-row">
                <div className="envgen-field">
                    <label className="envgen-field-label">UI Reference Style</label>
                    <select
                        className="envgen-field-select"
                        value={design.styleReference}
                        onChange={(e) => setDesign({ styleReference: e.target.value })}
                    >
                        {STYLE_REFERENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="envgen-field">
                    <label className="envgen-field-label">Default Theme</label>
                    <select
                        className="envgen-field-select"
                        value={design.theme}
                        onChange={(e) => setDesign({ theme: e.target.value })}
                    >
                        {THEME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-field">
                    <label className="envgen-field-label">Accent Color</label>
                    <div className="envgen-color-swatches">
                        {ACCENT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                className={`envgen-color-swatch ${design.accentColor === color.value ? 'selected' : ''}`}
                                style={{ backgroundColor: color.value, color: color.value }}
                                onClick={() => setDesign({ accentColor: color.value })}
                                title={color.label}
                                type="button"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="envgen-form-row">
                <div className="envgen-field">
                    <label className="envgen-field-label">Base Font Size</label>
                    <select
                        className="envgen-field-select"
                        value={design.fontSize}
                        onChange={(e) => setDesign({ fontSize: e.target.value })}
                    >
                        {FONT_SIZE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="envgen-field">
                    <label className="envgen-field-label">Border Radius</label>
                    <select
                        className="envgen-field-select"
                        value={design.borderRadius}
                        onChange={(e) => setDesign({ borderRadius: e.target.value })}
                    >
                        {BORDER_RADIUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="envgen-form-row envgen-form-row--single">
                <div className="envgen-field">
                    <label className="envgen-field-label">Spacing Density</label>
                    <select
                        className="envgen-field-select"
                        value={design.density}
                        onChange={(e) => setDesign({ density: e.target.value })}
                    >
                        {DENSITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
