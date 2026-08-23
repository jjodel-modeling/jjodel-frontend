import { useState, useEffect, useRef, useCallback } from 'react';
import type { ColorScheme, ActiveColorScheme, CustomColorScheme } from '../types';
import { derivePaletteSwatches } from '../utils/derivePalette';

interface ColorSchemeSelectorProps {
    colorScheme: ActiveColorScheme;
    onColorSchemeChange: (scheme: ActiveColorScheme) => void;
    customPalettes: CustomColorScheme[];
    onCreateCustomPalette: (name: string, seed: string) => void;
    onRenamePalette: (id: string, name: string) => void;
    onDeletePalette: (id: string) => void;
    /** Inert while a concrete-syntax viewpoint is active: the theme stops governing the render. */
    disabled?: boolean;
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

// Lower-cased built-in labels — reserved names a custom palette cannot reuse.
const BUILTIN_NAMES = [...MAIN_OPTIONS, ...PALETTE_OPTIONS].map(o => o.name.toLowerCase());

function ColorSchemeSelector({ colorScheme, onColorSchemeChange, customPalettes, onCreateCustomPalette, onRenamePalette, onDeletePalette, disabled = false }: ColorSchemeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSeed, setNewSeed] = useState('#3b82f6');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const submenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const creatingRef = useRef(false);
    const actionActiveRef = useRef(false);  // true while a rename/delete row action is open
    const editRowRef = useRef<HTMLDivElement>(null);

    // A menu left hanging open under a now-disabled trigger would still take clicks.
    useEffect(() => {
        if (disabled) { setOpen(false); setSubmenuOpen(false); }
    }, [disabled]);

    const customActive = customPalettes.find(p => p.id === colorScheme);
    const current = customActive
        ? { name: customActive.name, icon: 'bi-gem' }
        : (ALL_OPTIONS.get(colorScheme as ColorScheme) ?? { name: 'Default', icon: 'bi-palette' });
    const isPaletteActive = PALETTE_OPTIONS.some(o => o.id === colorScheme) || customPalettes.some(p => p.id === colorScheme);

    const updateCreating = useCallback((v: boolean) => {
        creatingRef.current = v;
        setCreating(v);
    }, []);

    const handleCreate = useCallback(() => {
        const name = newName.trim() || 'Custom palette';
        onCreateCustomPalette(name, newSeed);
        creatingRef.current = false;
        setCreating(false);
        setNewName('');
        setOpen(false);
        setSubmenuOpen(false);
    }, [newName, newSeed, onCreateCustomPalette]);

    // Rename validation: non-empty and not colliding (case-insensitive) with a
    // built-in label or another custom palette's name (the palette itself excluded).
    const isRenameValid = useCallback((name: string, selfId: string): boolean => {
        const t = name.trim().toLowerCase();
        if (!t) return false;
        if (BUILTIN_NAMES.includes(t)) return false;
        return !customPalettes.some(p => p.id !== selfId && p.name.trim().toLowerCase() === t);
    }, [customPalettes]);

    const startRename = useCallback((p: CustomColorScheme) => {
        setConfirmingDeleteId(null);
        setEditingId(p.id);
        setEditName(p.name);
    }, []);

    const cancelRename = useCallback(() => {
        setEditingId(null);
        setEditName('');
    }, []);

    const confirmRename = useCallback((id: string) => {
        if (!isRenameValid(editName, id)) return;
        onRenamePalette(id, editName.trim());
        setEditingId(null);
        setEditName('');
    }, [editName, isRenameValid, onRenamePalette]);

    const startDelete = useCallback((id: string) => {
        setEditingId(null);
        setConfirmingDeleteId(id);
    }, []);

    const cancelDelete = useCallback(() => {
        setConfirmingDeleteId(null);
    }, []);

    const confirmDelete = useCallback((id: string) => {
        onDeletePalette(id);
        setConfirmingDeleteId(null);
    }, [onDeletePalette]);

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
                if (creatingRef.current) { creatingRef.current = false; setCreating(false); return; }
                if (actionActiveRef.current) { setEditingId(null); setEditName(''); setConfirmingDeleteId(null); return; }
                setOpen(false);
                setSubmenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    // Reset the inline editor / row actions whenever the dropdown closes.
    useEffect(() => {
        if (!open) {
            creatingRef.current = false;
            setCreating(false);
            setEditingId(null);
            setEditName('');
            setConfirmingDeleteId(null);
        }
    }, [open]);

    // Keep submenu open while a rename/delete row action is in progress.
    useEffect(() => {
        actionActiveRef.current = editingId !== null || confirmingDeleteId !== null;
    }, [editingId, confirmingDeleteId]);

    // Clicking outside the active row cancels its rename/delete (no save).
    useEffect(() => {
        if (editingId === null && confirmingDeleteId === null) return;
        const onDown = (e: MouseEvent) => {
            if (editRowRef.current && !editRowRef.current.contains(e.target as Node)) {
                setEditingId(null);
                setEditName('');
                setConfirmingDeleteId(null);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [editingId, confirmingDeleteId]);

    const handleSelect = useCallback((id: ActiveColorScheme) => {
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
        if (creatingRef.current || actionActiveRef.current) return;
        submenuTimeout.current = setTimeout(() => setSubmenuOpen(false), 150);
    }, []);

    const handleSubmenuEnter = useCallback(() => {
        if (submenuTimeout.current) clearTimeout(submenuTimeout.current);
    }, []);

    const handleSubmenuLeave = useCallback(() => {
        if (creatingRef.current || actionActiveRef.current) return;
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
                disabled={disabled}
                title={disabled ? 'The active viewpoint defines the colors — switch to Abstract syntax to change them' : 'Color scheme'}
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

                                {/* Your palettes (user-created, seed-driven) */}
                                {customPalettes.length > 0 && (
                                    <>
                                        <div className="scheme-selector__divider" />
                                        <div className="scheme-selector__section-label">Your palettes</div>
                                        {customPalettes.map(p => {
                                            const active = colorScheme === p.id;
                                            const isEditing = editingId === p.id;
                                            const isDeleting = confirmingDeleteId === p.id;
                                            const renameValid = isRenameValid(editName, p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    ref={isEditing || isDeleting ? editRowRef : undefined}
                                                    className={`scheme-selector__sub-option scheme-selector__custom-row ${active ? 'active' : ''}`}
                                                    onClick={() => { if (!isEditing && !isDeleting) handleSelect(p.id); }}
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                className={`scheme-selector__rename-input ${renameValid ? '' : 'invalid'}`}
                                                                type="text"
                                                                value={editName}
                                                                autoFocus
                                                                onClick={e => e.stopPropagation()}
                                                                onChange={e => setEditName(e.target.value)}
                                                                onKeyDown={e => {
                                                                    e.stopPropagation();
                                                                    if (e.key === 'Enter') confirmRename(p.id);
                                                                    else if (e.key === 'Escape') cancelRename();
                                                                }}
                                                            />
                                                            <div className="scheme-selector__row-actions scheme-selector__row-actions--static">
                                                                <button
                                                                    className="scheme-selector__row-action"
                                                                    title="Confirm"
                                                                    disabled={!renameValid}
                                                                    onClick={e => { e.stopPropagation(); confirmRename(p.id); }}
                                                                >
                                                                    <i className="bi bi-check" />
                                                                </button>
                                                                <button
                                                                    className="scheme-selector__row-action"
                                                                    title="Cancel"
                                                                    onClick={e => { e.stopPropagation(); cancelRename(); }}
                                                                >
                                                                    <i className="bi bi-x" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : isDeleting ? (
                                                        <>
                                                            <span className="scheme-selector__confirm-label">Delete?</span>
                                                            <div className="scheme-selector__row-actions scheme-selector__row-actions--static">
                                                                <button
                                                                    className="scheme-selector__row-action scheme-selector__row-action--danger"
                                                                    title="Confirm delete"
                                                                    onClick={e => { e.stopPropagation(); confirmDelete(p.id); }}
                                                                >
                                                                    <i className="bi bi-check" />
                                                                </button>
                                                                <button
                                                                    className="scheme-selector__row-action"
                                                                    title="Cancel"
                                                                    onClick={e => { e.stopPropagation(); cancelDelete(); }}
                                                                >
                                                                    <i className="bi bi-x" />
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className={`bi ${active ? 'bi-check2' : ''}`} />
                                                            <span className="scheme-selector__sub-option-name">{p.name}</span>
                                                            {/* Right slot: swatches at rest, actions on hover (same fixed slot, no overlay) */}
                                                            <div className="scheme-selector__row-slot">
                                                                <div className="scheme-selector__swatches">
                                                                    {derivePaletteSwatches(p.seed).map((color, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="scheme-selector__swatch"
                                                                            style={{ backgroundColor: color }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <div className="scheme-selector__row-actions">
                                                                    <button
                                                                        className="scheme-selector__row-action"
                                                                        title="Rename"
                                                                        onClick={e => { e.stopPropagation(); startRename(p); }}
                                                                    >
                                                                        <i className="bi bi-pencil" />
                                                                    </button>
                                                                    <button
                                                                        className="scheme-selector__row-action scheme-selector__row-action--danger"
                                                                        title="Delete"
                                                                        onClick={e => { e.stopPropagation(); startDelete(p.id); }}
                                                                    >
                                                                        <i className="bi bi-trash" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {/* New palette: trigger + inline mini-editor */}
                                <div className="scheme-selector__divider" />
                                {!creating ? (
                                    <button
                                        className="scheme-selector__new-btn"
                                        onClick={() => updateCreating(true)}
                                    >
                                        <i className="bi bi-plus-lg" />
                                        <span>New palette</span>
                                    </button>
                                ) : (
                                    <div className="scheme-selector__editor">
                                        <input
                                            className="scheme-selector__editor-name"
                                            type="text"
                                            placeholder="Palette name"
                                            value={newName}
                                            autoFocus
                                            onChange={e => setNewName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                                        />
                                        <div className="scheme-selector__editor-row">
                                            <input
                                                className="scheme-selector__editor-seed"
                                                type="color"
                                                value={newSeed}
                                                onChange={e => setNewSeed(e.target.value)}
                                                title="Seed color"
                                            />
                                            <div className="scheme-selector__swatches">
                                                {derivePaletteSwatches(newSeed).map((color, i) => (
                                                    <span
                                                        key={i}
                                                        className="scheme-selector__swatch"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="scheme-selector__editor-actions">
                                            <button
                                                className="scheme-selector__editor-btn"
                                                onClick={() => updateCreating(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="scheme-selector__editor-btn scheme-selector__editor-btn--primary"
                                                onClick={handleCreate}
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                )}
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
