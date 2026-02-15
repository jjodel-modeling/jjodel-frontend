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

interface PastelOption {
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

const PASTEL_OPTIONS: PastelOption[] = [
    { id: 'pastel-lavender', name: 'Lavender Dream',  swatches: ['#c4b5fd', '#b8b8d8', '#d8b4fe', '#b0a8d0'] },
    { id: 'pastel-rose',     name: 'Rose Garden',     swatches: ['#f9a8d4', '#e0b4c0', '#fda4af', '#e8c0c8'] },
    { id: 'pastel-ocean',    name: 'Ocean Breeze',    swatches: ['#5eead4', '#6ee7b7', '#67e8f9', '#80c8c8'] },
    { id: 'pastel-earth',    name: 'Earthy Warmth',   swatches: ['#fbbf24', '#d4c0a0', '#fdba74', '#e0d0b0'] },
    { id: 'pastel-meadow',   name: 'Spring Meadow',   swatches: ['#86efac', '#90d4a0', '#bef264', '#a0c890'] },
];

// Build a lookup for trigger display
const ALL_OPTIONS = new Map<ColorScheme, { name: string; icon: string }>([
    ...MAIN_OPTIONS.map(o => [o.id, { name: o.name, icon: o.icon }] as const),
    ...PASTEL_OPTIONS.map(o => [o.id, { name: o.name, icon: 'bi-droplet-half' }] as const),
]);

function ColorSchemeSelector({ colorScheme, onColorSchemeChange }: ColorSchemeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const submenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const current = ALL_OPTIONS.get(colorScheme) ?? { name: 'Default', icon: 'bi-palette' };
    const isPastelActive = colorScheme.startsWith('pastel-');

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

    // Insert pastel group after monochrome (index 1)
    const topOptions = MAIN_OPTIONS.slice(0, 2);    // default, monochrome
    const bottomOptions = MAIN_OPTIONS.slice(2);     // high-contrast, print

    return (
        <div className="scheme-selector" ref={dropdownRef}>
            <button
                className="toolbar-btn scheme-selector__trigger"
                onClick={() => setOpen(prev => !prev)}
                title="Color scheme"
            >
                <i className={`bi ${current.icon}`} />
                <span className="scheme-selector__label">{current.name}</span>
                <i className="bi bi-chevron-down scheme-selector__chevron" />
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
                            <div>
                                <div className="scheme-selector__option-name">{opt.name}</div>
                                <div className="scheme-selector__option-desc">{opt.desc}</div>
                            </div>
                        </button>
                    ))}

                    {/* Pastel group with submenu */}
                    <div
                        className={`scheme-selector__group-item ${submenuOpen ? 'submenu-open' : ''} ${isPastelActive ? 'has-active-child' : ''}`}
                        onMouseEnter={handlePastelEnter}
                        onMouseLeave={handlePastelLeave}
                    >
                        <i className="bi bi-droplet-half" />
                        <span className="scheme-selector__group-label">Pastel</span>
                        <i className="bi bi-chevron-right scheme-selector__group-chevron" />

                        {submenuOpen && (
                            <div
                                className="scheme-selector__submenu"
                                onMouseEnter={handleSubmenuEnter}
                                onMouseLeave={handleSubmenuLeave}
                            >
                                {PASTEL_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`scheme-selector__sub-option ${colorScheme === opt.id ? 'active' : ''}`}
                                        onClick={() => handleSelect(opt.id)}
                                    >
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
                            <div>
                                <div className="scheme-selector__option-name">{opt.name}</div>
                                <div className="scheme-selector__option-desc">{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ColorSchemeSelector;
