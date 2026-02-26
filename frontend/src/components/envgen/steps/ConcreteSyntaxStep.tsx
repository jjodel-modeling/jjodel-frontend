import React, { useRef, useCallback } from 'react';
import type { ConcreteSyntaxEntry } from '../types';
import { SYNTAX_PRESET_OPTIONS } from '../types';

interface ConcreteSyntaxStepProps {
    concreteSyntax: ConcreteSyntaxEntry[];
    setConcreteSyntax: (entries: ConcreteSyntaxEntry[]) => void;
    metamodelId: string;
}

export const ConcreteSyntaxStep: React.FC<ConcreteSyntaxStepProps> = ({
    concreteSyntax,
    setConcreteSyntax,
    metamodelId,
}) => {
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleAddSyntax = useCallback(() => {
        const newEntry: ConcreteSyntaxEntry = {
            id: 'syntax_' + Date.now().toString(36),
            name: `Syntax ${concreteSyntax.length + 1}`,
            isDefault: false,
            preset: 'custom',
            description: '',
            imageDataUrl: null,
        };
        setConcreteSyntax([...concreteSyntax, newEntry]);
    }, [concreteSyntax, setConcreteSyntax]);

    const handleRemove = useCallback((id: string) => {
        setConcreteSyntax(concreteSyntax.filter(s => s.id !== id));
    }, [concreteSyntax, setConcreteSyntax]);

    const handleUpdate = useCallback((id: string, patch: Partial<ConcreteSyntaxEntry>) => {
        setConcreteSyntax(concreteSyntax.map(s => s.id === id ? { ...s, ...patch } : s));
    }, [concreteSyntax, setConcreteSyntax]);

    const handleImageUpload = useCallback((id: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            handleUpdate(id, { imageDataUrl: dataUrl });
        };
        reader.readAsDataURL(file);
    }, [handleUpdate]);

    return (
        <div>
            <div className="envgen-section-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 className="envgen-section-title">
                            Concrete Syntax ({concreteSyntax.length})
                        </h3>
                        <p className="envgen-section-description">
                            Define the visual notation for your modeling elements
                        </p>
                    </div>
                    <button
                        type="button"
                        className="envgen-btn envgen-btn--secondary"
                        onClick={handleAddSyntax}
                    >
                        <i className="bi bi-plus" /> Add Syntax
                    </button>
                </div>
            </div>

            <div className="envgen-syntax-cards">
                {concreteSyntax.map((syntax) => (
                    <div
                        key={syntax.id}
                        className={`envgen-syntax-card ${syntax.isDefault ? 'envgen-syntax-card--default' : ''}`}
                    >
                        <div className="envgen-syntax-card__header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="envgen-syntax-card__name-input"
                                    value={syntax.name}
                                    onChange={(e) => handleUpdate(syntax.id, { name: e.target.value })}
                                />
                                {syntax.isDefault && (
                                    <span className="envgen-syntax-card__badge">DEFAULT</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <select
                                    className="envgen-field-select"
                                    value={syntax.preset}
                                    onChange={(e) => handleUpdate(syntax.id, { preset: e.target.value })}
                                    style={{ width: '180px' }}
                                >
                                    {SYNTAX_PRESET_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {!syntax.isDefault && (
                                    <button
                                        type="button"
                                        className="envgen-syntax-card__remove"
                                        onClick={() => handleRemove(syntax.id)}
                                        title="Remove syntax"
                                    >
                                        <i className="bi bi-trash" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="envgen-syntax-card__body">
                            <textarea
                                className="envgen-field-textarea"
                                placeholder="Describe the visual rendering for each element type, colors, shapes, line styles..."
                                value={syntax.description}
                                onChange={(e) => handleUpdate(syntax.id, { description: e.target.value })}
                            />

                            {syntax.imageDataUrl ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={syntax.imageDataUrl}
                                        alt="Reference"
                                        className="envgen-syntax-card__image-preview"
                                    />
                                    <button
                                        type="button"
                                        className="envgen-syntax-card__remove"
                                        style={{ position: 'absolute', top: 4, right: 4 }}
                                        onClick={() => handleUpdate(syntax.id, { imageDataUrl: null })}
                                        title="Remove image"
                                    >
                                        <i className="bi bi-x" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="envgen-syntax-card__upload-zone"
                                    onClick={() => fileInputRefs.current[syntax.id]?.click()}
                                >
                                    <i className="bi bi-cloud-upload" />
                                    Drop or click to upload a reference image
                                    <input
                                        ref={(el) => { fileInputRefs.current[syntax.id] = el; }}
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.svg"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(syntax.id, file);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="envgen-info-box" style={{ marginTop: '16px' }}>
                <i className="bi bi-lightbulb envgen-info-box__icon" />
                <div className="envgen-info-box__content">
                    <p className="envgen-info-box__tip">
                        You can upload reference images or screenshots of existing notations to guide the generation.
                    </p>
                </div>
            </div>
        </div>
    );
};
