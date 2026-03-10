/**
 * Editor V3 — NotationSelector: toolbar for live notation and color scheme switching.
 *
 * Renders a compact row of buttons to switch notation mode and color scheme.
 * When notation changes, all nodes re-render with the new built-in view.
 */

import React from 'react';
import type { NotationMode, ColorScheme } from '../types';

export interface NotationSelectorProps {
    notation: NotationMode;
    colorScheme: ColorScheme;
    onNotationChange: (notation: NotationMode) => void;
    onColorSchemeChange: (scheme: ColorScheme) => void;
}

const NOTATION_OPTIONS: { value: NotationMode; label: string; icon: string }[] = [
    { value: 'uml', label: 'UML', icon: 'bi-diagram-3' },
    { value: 'simplified', label: 'Simple', icon: 'bi-square' },
];

const COLOR_SCHEME_OPTIONS: { value: ColorScheme; label: string; color: string }[] = [
    { value: 'default', label: 'Default', color: '#06b6d4' },
    { value: 'pastel', label: 'Pastel', color: '#a78bfa' },
    { value: 'ocean', label: 'Ocean', color: '#0ea5e9' },
    { value: 'forest', label: 'Forest', color: '#22c55e' },
    { value: 'sunset', label: 'Sunset', color: '#f97316' },
    { value: 'monochrome', label: 'Mono', color: '#94a3b8' },
    { value: 'neon', label: 'Neon', color: '#ec4899' },
    { value: 'earth', label: 'Earth', color: '#d97706' },
    { value: 'nordic', label: 'Nordic', color: '#0f766e' },
];

export function NotationSelector({
    notation,
    colorScheme,
    onNotationChange,
    onColorSchemeChange,
}: NotationSelectorProps) {
    return (
        <div className="v3-notation-selector">
            {/* Notation toggle */}
            <div className="v3-notation-selector__group">
                <span className="v3-notation-selector__label">Notation</span>
                <div className="v3-notation-selector__buttons">
                    {NOTATION_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`v3-notation-selector__btn ${notation === opt.value ? 'v3-notation-selector__btn--active' : ''}`}
                            onClick={() => onNotationChange(opt.value)}
                            title={opt.label}
                        >
                            <i className={opt.icon} />
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color scheme picker */}
            <div className="v3-notation-selector__group">
                <span className="v3-notation-selector__label">Colors</span>
                <div className="v3-notation-selector__swatches">
                    {COLOR_SCHEME_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`v3-notation-selector__swatch ${colorScheme === opt.value ? 'v3-notation-selector__swatch--active' : ''}`}
                            style={{ backgroundColor: opt.color }}
                            onClick={() => onColorSchemeChange(opt.value)}
                            title={opt.label}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
