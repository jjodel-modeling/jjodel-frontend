/**
 * ColorPickerPopover
 * Popover with opacity slider, color harmony suggestions, and delete button.
 * Opens when clicking a color dot in CssVariablesEditor.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';

export interface ColorPickerPopoverProps {
    /** Current color as RGBA */
    rgba: tinycolor.ColorFormats.RGBA;
    /** Anchor element to position near */
    anchorEl: HTMLElement | null;
    /** Called when color hex changes */
    onColorChange: (hex: string) => void;
    /** Called when opacity changes */
    onOpacityChange: (alpha: number) => void;
    /** Called when a harmony color should be added to the palette */
    onAddColor: (rgba: tinycolor.ColorFormats.RGBA) => void;
    /** Called to delete this color */
    onDelete: () => void;
    /** Called to close the popover */
    onClose: () => void;
}

interface HarmonySection {
    label: string;
    colors: tinycolor.Instance[];
}

function computeHarmonies(color: tinycolor.Instance): HarmonySection[] {
    return [
        {
            label: 'Analogous',
            colors: color.analogous(7, 20).slice(1),
        },
        {
            label: 'Lighten',
            colors: [1, 2, 3, 4, 5, 6].map(n => color.clone().lighten((n / 12) * 100)),
        },
        {
            label: 'Darken',
            colors: [1, 2, 3, 4, 5, 6].map(n => color.clone().darken((n / 12) * 100)),
        },
        {
            label: 'Complementary',
            colors: [color.complement()],
        },
        {
            label: 'Split Complementary',
            colors: color.splitcomplement().slice(1),
        },
        {
            label: 'Triadic',
            colors: color.triad().slice(1),
        },
        {
            label: 'Tetradic',
            colors: color.tetrad().slice(1),
        },
    ];
}

const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
    rgba,
    anchorEl,
    onColorChange,
    onOpacityChange,
    onAddColor,
    onDelete,
    onClose,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const color = useMemo(() => tinycolor(rgba), [rgba]);
    const [localHex, setLocalHex] = useState(color.toHexString());

    // Sync when external color changes
    useEffect(() => {
        setLocalHex(tinycolor(rgba).toHexString());
    }, [rgba]);

    const harmonies = useMemo(() => computeHarmonies(color), [color]);

    // Position popover near anchor
    const [pos, setPos] = useState({ top: 0, left: 0 });
    useEffect(() => {
        if (!anchorEl) return;
        const rect = anchorEl.getBoundingClientRect();
        const popW = 260;
        const popH = 420;
        let top = rect.bottom + 6;
        let left = rect.left + rect.width / 2 - popW / 2;

        // Clamp to viewport
        if (left < 8) left = 8;
        if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
        if (top + popH > window.innerHeight - 8) {
            top = rect.top - popH - 6;
        }
        setPos({ top, left });
    }, [anchorEl]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Defer to avoid immediate close from the same click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handler);
        };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleNativeColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        setLocalHex(hex);
        onColorChange(hex);
    }, [onColorChange]);

    const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onOpacityChange(parseFloat(e.target.value));
    }, [onOpacityChange]);

    const handleAddHarmonyColor = useCallback((c: tinycolor.Instance) => {
        onAddColor(c.toRgb());
    }, [onAddColor]);

    const opacityPercent = Math.round((rgba.a ?? 1) * 100);

    return createPortal(
        <div className="cpop" ref={popoverRef} style={{ top: pos.top, left: pos.left }}>
            {/* Color preview + native picker */}
            <div className="cpop__header">
                <button
                    className="cpop__swatch"
                    style={{ background: color.toRgbString() }}
                    title="Pick color"
                    onClick={() => colorInputRef.current?.click()}
                />
                <input
                    ref={colorInputRef}
                    type="color"
                    className="cpop__native-input"
                    value={localHex}
                    onChange={handleNativeColorChange}
                />
                <div className="cpop__header-info">
                    <span className="cpop__hex">{localHex}</span>
                    <span className="cpop__alpha">{opacityPercent}%</span>
                </div>
            </div>

            {/* Opacity slider */}
            <div className="cpop__opacity">
                <label className="cpop__section-label">Opacity</label>
                <div className="cpop__slider-row">
                    <input
                        type="range"
                        className="cpop__slider"
                        min={0}
                        max={1}
                        step={0.01}
                        value={rgba.a ?? 1}
                        onChange={handleOpacityChange}
                        style={{
                            background: `linear-gradient(to right, transparent, ${color.toHexString()})`,
                        }}
                    />
                    <span className="cpop__slider-value">{opacityPercent}%</span>
                </div>
            </div>

            {/* Harmony sections */}
            <div className="cpop__harmonies">
                {harmonies.map(section => (
                    <div key={section.label} className="cpop__harmony">
                        <span className="cpop__section-label">{section.label}</span>
                        <div className="cpop__harmony-row">
                            {section.colors.map((c, i) => (
                                <button
                                    key={i}
                                    className="cpop__harmony-dot"
                                    style={{ background: c.toRgbString() }}
                                    title={`Add ${c.toHexString()}`}
                                    onClick={() => handleAddHarmonyColor(c)}
                                >
                                    <i className="bi bi-plus cpop__harmony-plus" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete */}
            <button className="cpop__delete" onClick={onDelete}>
                <i className="bi bi-trash3" /> Remove color
            </button>
        </div>,
        document.body,
    );
};

export default ColorPickerPopover;
