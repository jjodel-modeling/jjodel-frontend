import { useState, useEffect, useRef, useCallback } from 'react';
import type { ColorScheme } from '../types';

interface ColorSchemeSelectorProps {
    colorScheme: ColorScheme;
    onColorSchemeChange: (scheme: ColorScheme) => void;
}

interface SchemeOption {
    id: ColorScheme;
    name: string;
    desc: string;
    icon: string;
}

interface PaletteOption {
    id: ColorScheme;
    name: string;
    swatches: string[]; // 4 hex colors: [class, abstract, enum, package]
}

const MAIN_OPTIONS: SchemeOption[] = [
    { id: 'default',        name: 'Default',        desc: 'Theme colors',     icon: 'bi-palette' },
    { id: 'monochrome',     name: 'Monochrome',     desc: 'Uniform grays',    icon: 'bi-circle-half' },
    // pastel group handled separately
    { id: 'high-contrast',  name: 'High Contrast',  desc: 'Bold, saturated',  icon: 'bi-brightness-high' },
    { id: 'print',          name: 'Print',           desc: 'No fills, B&W',   icon: 'bi-printer' },
];

const PALETTE_OPTIONS: PaletteOption[] = [
    { id: 'sapphire',    name: 'Sapphire',    swatches: ['#3b82f6', '#94a3b8', '#38bdf8', '#475569'] },
    { id: 'amethyst',    name: 'Amethyst',    swatches: ['#8b5cf6', '#6d5da0', '#a78bfa', '#4c1d95'] },
    { id: 'jade',        name: 'Jade',        swatches: ['#10b981', '#3d7a60', '#2dd4bf', '#134e4a'] },
    { id: 'terracotta',  name: 'Terracotta',  swatches: ['#d97706', '#a08060', '#fb923c', '#78350f'] },
    { id: 'crimson',     name: 'Crimson',     swatches: ['#ef4444', '#9a4040', '#fb7185', '#881337'] },
];

// Build a lookup for trigger display
const ALL_OPTIONS = new Map<ColorScheme, { name: string; icon: string }>([
    ...MAIN_OPTIONS.map(o => [o.id, { name: o.name, icon: o.icon }] as const),
    ...PALETTE_OPTIONS.map(o => [o.id, { name: o.name, icon: 'bi-gem' }] as const),
]);

function ColorSchemeSelector({ colorScheme, onColorSchemeChange }: ColorSchemeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const submenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = ALL_OPTIONS.get(colorScheme) ?? { name: 'Default', icon: 'bi-palette' };
    const isPaletteActive = PALETTE_OPTIONS.some(o => o.id === colorScheme);

    // Close dropdown on click outside
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSubmenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick, true);
        return () => document.removeEventListener('mousedown', handleClick, true);
    }, [open]);

    // Close dropdown on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setSubmenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const handleSelect = useCallback((id: ColorScheme) => {
        onColorSchemeChange(id);
        setOpen(false);
        setSubmenuOpen(false);
    }, [onColorSchemeChange]);

    // Submenu hover with delay to avoid flickering
    const handlePastelEnter = useCallback(() => {
        if (submenuTimeout.current) clearTimeout(submenuTimeout.current);
        setSubmenuOpen(true);
    }, []);

    const handlePastelLeave = useCallback(() => {
        submenuTimeout.current = setTimeout(() => setSubmenuOpen(false), 150);
    }, []);

    const handleSubmenuEnter = useCallback(() => {
        if (submenuTimeout.current) clearTimeout(submenuTimeout.current);
    }, []);

    const handleSubmenuLeave = useCallback(() => {
        submenuTimeout.current = setTimeout(() => setSubmenuOpen(false), 150);
    }, []);

    // Insert palette group after monochrome (index 1)
    const topOptions = MAIN_OPTIONS.slice(0, 2);    // default, monochrome
    const bottomOptions = MAIN_OPTIONS.slice(2);     // high-contrast, print

    return (
        <div className="scheme-selector" ref={dropdownRef}>
            <button
                className="toolbar-dropdown-btn scheme-selector__trigger"
                onClick={() => setOpen(prev => !prev)}
                title="Color scheme"
            >
                <span>Theme: {current.name}</span>
                <i className="bi bi-chevron-down toolbar-dropdown-btn__chevron" />
            </button>
            {open && (
                <div className="scheme-selector__dropdown">
                    {/* Top options: Default, Monochrome */}
                    {topOptions.map(opt => (
                        <button
                            key={opt.id}
                            className={`scheme-selector__option ${colorScheme === opt.id ? 'active' : ''}`}
                            onClick={() => handleSelect(opt.id)}
                        >
                            <i className={`bi ${opt.icon}`} />
                            <div style={{ flex: 1 }}>
                                <div className="scheme-selector__option-name">{opt.name}</div>
                                <div className="scheme-selector__option-desc">{opt.desc}</div>
                            </div>
                            <i className={`bi bi-check2 scheme-selector__check`} />
                        </button>
                    ))}

                    {/* Palette group with submenu */}
                    <div
                        className={`scheme-selector__group-item ${submenuOpen ? 'submenu-open' : ''} ${isPaletteActive ? 'has-active-child' : ''}`}
                        onMouseEnter={handlePastelEnter}
                        onMouseLeave={handlePastelLeave}
                    >
                        <i className="bi bi-gem" />
                        <span className="scheme-selector__group-label">Palette</span>
                        <i className={`bi bi-check2 scheme-selector__check`} />
                        <i className="bi bi-chevron-right scheme-selector__group-chevron" />

                        {submenuOpen && (
                            <div
                                className="scheme-selector__submenu"
                                onMouseEnter={handleSubmenuEnter}
                                onMouseLeave={handleSubmenuLeave}
                            >
                                {PALETTE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`scheme-selector__sub-option ${colorScheme === opt.id ? 'active' : ''}`}
                                        onClick={() => handleSelect(opt.id)}
                                    >
                                        <i className={`bi ${colorScheme === opt.id ? 'bi-check2' : ''}`} />
                                        <span className="scheme-selector__sub-option-name">{opt.name}</span>
                                        <div className="scheme-selector__swatches">
                                            {opt.swatches.map((color, i) => (
                                                <span
                                                    key={i}
                                                    className="scheme-selector__swatch"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom options: High Contrast, Print */}
                    {bottomOptions.map(opt => (
                        <button
                            key={opt.id}
                            className={`scheme-selector__option ${colorScheme === opt.id ? 'active' : ''}`}
                            onClick={() => handleSelect(opt.id)}
                        >
                            <i className={`bi ${opt.icon}`} />
                            <div style={{ flex: 1 }}>
                                <div className="scheme-selector__option-name">{opt.name}</div>
                                <div className="scheme-selector__option-desc">{opt.desc}</div>
                            </div>
                            <i className={`bi bi-check2 scheme-selector__check`} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ColorSchemeSelector;
