import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import tinycolor from 'tinycolor2';
import type { LViewElement } from '../../../../joiner';
import type {
    PaletteType,
    PaletteControl,
    NumberControl,
    StringControl,
    PathControl,
} from '../../../../view/viewElement/view';
import ColorPickerPopover from './ColorPickerPopover';
import { parsePath, serializePath } from '../../../editors/pathDataModel';
import PathEditorModal from './PathEditorModal';

interface CssVariablesEditorProps {
    view: LViewElement;
    onViewUpdate: () => void;
}

type ControlType = 'color' | 'number' | 'text' | 'path';

// ============================================================================
// ColorDot — opens the ColorPickerPopover on click
// ============================================================================

const ColorDot: React.FC<{
    rgba: tinycolor.ColorFormats.RGBA;
    isPopoverOpen: boolean;
    onOpenPopover: (el: HTMLElement) => void;
}> = ({ rgba, isPopoverOpen, onOpenPopover }) => {
    const color = tinycolor(rgba);
    const dotRef = useRef<HTMLSpanElement>(null);

    return (
        <span className="vep-cssvar__dot-wrap">
            <span
                ref={dotRef}
                className={`vep-cssvar__dot ${isPopoverOpen ? 'vep-cssvar__dot--active' : ''}`}
                style={{ background: color.toRgbString() }}
                title={color.toHexString()}
                onClick={() => dotRef.current && onOpenPopover(dotRef.current)}
            />
        </span>
    );
};

// ============================================================================
// PathPreview — inline SVG preview of an SVG path string
// ============================================================================

const PathPreview: React.FC<{ pathString: string; fillMode?: 'filled' | 'outline'; onClick?: () => void }> = ({ pathString, fillMode = 'outline', onClick }) => {
    const pathData = useMemo(() => parsePath(pathString), [pathString]);
    const svgD = useMemo(() => serializePath(pathData), [pathData]);
    const isValid = pathData.length > 0;

    // Compute viewBox from path bounding box
    const viewBox = useMemo(() => {
        if (!isValid) return '0 0 20 10';
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const pt of pathData) {
            if (pt.x < minX) minX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y > maxY) maxY = pt.y;
            if (pt.cx != null && pt.cy != null) {
                if (pt.cx < minX) minX = pt.cx;
                if (pt.cy < minY) minY = pt.cy;
                if (pt.cx > maxX) maxX = pt.cx;
                if (pt.cy > maxY) maxY = pt.cy;
            }
            if (pt.cx1 != null && pt.cy1 != null) {
                if (pt.cx1 < minX) minX = pt.cx1;
                if (pt.cy1 < minY) minY = pt.cy1;
                if (pt.cx1 > maxX) maxX = pt.cx1;
                if (pt.cy1 > maxY) maxY = pt.cy1;
            }
            if (pt.cx2 != null && pt.cy2 != null) {
                if (pt.cx2 < minX) minX = pt.cx2;
                if (pt.cy2 < minY) minY = pt.cy2;
                if (pt.cx2 > maxX) maxX = pt.cx2;
                if (pt.cy2 > maxY) maxY = pt.cy2;
            }
        }
        const pad = 2;
        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);
        return `${minX - pad} ${minY - pad} ${w + pad * 2} ${h + pad * 2}`;
    }, [pathData, isValid]);

    if (!pathString.trim()) {
        return (
            <div
                className={`vep-cssvar__path-preview ${onClick ? 'vep-cssvar__path-preview--clickable' : ''}`}
                onClick={onClick}
                title={onClick ? 'Click to edit path' : undefined}
            >
                <svg viewBox="0 0 20 10" preserveAspectRatio="xMidYMid meet">
                    <text x="10" y="6" textAnchor="middle" fontSize="2.5" fill="#cbd5e1">
                        No path
                    </text>
                </svg>
                {onClick && (
                    <span className="vep-cssvar__path-edit-hint">
                        <i className="bi bi-pencil" /> Click to edit
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            className={`vep-cssvar__path-preview ${!isValid ? 'vep-cssvar__path-preview--invalid' : ''} ${onClick ? 'vep-cssvar__path-preview--clickable' : ''}`}
            onClick={onClick}
            title={onClick ? 'Click to edit path' : undefined}
        >
            <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
                {isValid && fillMode === 'filled' && (
                    <path
                        d={svgD}
                        fillRule="evenodd"
                        fill="#334155"
                        stroke="none"
                    />
                )}
                {isValid && fillMode !== 'filled' && (
                    <path
                        d={svgD}
                        fillRule="evenodd"
                        fill="none"
                        stroke="#334155"
                        strokeWidth={Math.max((parseFloat(viewBox.split(' ')[2]) || 20) / 100, 0.3)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {!isValid && (
                    <text x="10" y="6" textAnchor="middle" fontSize="2.5" fill="#ef4444">
                        Invalid path
                    </text>
                )}
            </svg>
            {onClick && (
                <span className="vep-cssvar__path-edit-hint">
                    <i className="bi bi-pencil" />
                </span>
            )}
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

const CssVariablesEditor: React.FC<CssVariablesEditorProps> = ({ view, onViewUpdate }) => {
    const dview = view.__raw;
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);

    // Popover state: which color is being edited
    const [popover, setPopover] = useState<{
        prefix: string;
        index: number;
        anchorEl: HTMLElement;
    } | null>(null);

    // Path editor modal state
    const [pathEditorPrefix, setPathEditorPrefix] = useState<string | null>(null);

    // Local palette state — React re-renders reliably on changes
    const [localPalette, setLocalPalette] = useState<PaletteType>(
        () => ({ ...(view.palette || {}) }),
    );

    // Sync when view changes externally (different view selected)
    useEffect(() => {
        setLocalPalette({ ...(view.palette || {}) });
    }, [dview]);

    // Close add-menu on outside click
    useEffect(() => {
        if (!addMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
                setAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [addMenuOpen]);

    // --- Palette mutation helpers ---

    const getPalette = useCallback((): PaletteType => ({ ...localPalette }), [localPalette]);

    /** Commit palette change: persist to model + update local state */
    const commit = useCallback((newPalette: PaletteType) => {
        view.palette = newPalette;
        setLocalPalette({ ...newPalette });
        onViewUpdate();
    }, [view, onViewUpdate]);

    const addControl = useCallback((type: ControlType) => {
        const palette = getPalette();
        const prefixBase = type === 'color' ? 'palette_' : type + '_';
        let i = Object.values(palette).filter(v => (v as any).type === type).length + 1;
        let prefix: string;
        while (true) {
            prefix = prefixBase + i++;
            if (!(prefix in palette)) break;
        }
        const tmp: PaletteType = { ...palette };
        switch (type) {
            case 'color':
                tmp[prefix] = { type: 'color', value: [] };
                break;
            case 'number':
                tmp[prefix] = { type: 'number', value: 0, unit: 'px' } as NumberControl;
                break;
            case 'text':
                tmp[prefix] = { type: 'text', value: '' };
                break;
            case 'path':
                tmp[prefix] = { type: 'path', value: '', x: '', y: '', options: [] } as PathControl;
                break;
        }
        commit(tmp);
        setAddMenuOpen(false);
    }, [getPalette, commit]);

    const removeControl = useCallback((prefix: string) => {
        const tmp = getPalette();
        delete tmp[prefix];
        commit(tmp);
    }, [getPalette, commit]);

    const renamePrefix = useCallback((oldPrefix: string, newPrefix: string) => {
        const sanitized = newPrefix.replace(/[^\w\-]/g, '-');
        const palette = getPalette();
        if (!sanitized || sanitized === oldPrefix || palette[sanitized]) return;
        const tmp: PaletteType = {};
        for (const [k, v] of Object.entries(palette)) {
            tmp[k === oldPrefix ? sanitized : k] = v;
        }
        commit(tmp);
    }, [getPalette, commit]);

    const addColorStop = useCallback((prefix: string, rgba?: tinycolor.ColorFormats.RGBA) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const newColor = rgba ?? tinycolor('#94a3b8').toRgb();
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value: [...ctrl.value, newColor] };
        commit(tmp);
    }, [getPalette, commit]);

    const setColorStop = useCallback((prefix: string, index: number, hex: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const tmp = { ...palette };
        const values = [...ctrl.value];
        const existing = values[index];
        const rgba = tinycolor(hex).toRgb();
        rgba.a = existing?.a ?? 1;
        values[index] = rgba;
        tmp[prefix] = { ...ctrl, value: values };
        commit(tmp);
    }, [getPalette, commit]);

    const setColorOpacity = useCallback((prefix: string, index: number, alpha: number) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const tmp = { ...palette };
        const values = [...ctrl.value];
        values[index] = { ...values[index], a: alpha };
        tmp[prefix] = { ...ctrl, value: values };
        commit(tmp);
    }, [getPalette, commit]);

    const removeColorStop = useCallback((prefix: string, index: number) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value: ctrl.value.filter((_, i) => i !== index) };
        commit(tmp);
    }, [getPalette, commit]);

    const setNumberValue = useCallback((prefix: string, value: number) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as NumberControl;
        if (!ctrl || ctrl.type !== 'number') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value };
        commit(tmp);
    }, [getPalette, commit]);

    const setNumberUnit = useCallback((prefix: string, unit: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as NumberControl;
        if (!ctrl || ctrl.type !== 'number') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, unit } as NumberControl;
        commit(tmp);
    }, [getPalette, commit]);

    const setTextValue = useCallback((prefix: string, value: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as StringControl;
        if (!ctrl || ctrl.type !== 'text') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value };
        commit(tmp);
    }, [getPalette, commit]);

    const setPathValue = useCallback((prefix: string, value: string, fillMode?: 'filled' | 'outline') => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PathControl;
        if (!ctrl || ctrl.type !== 'path') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value, ...(fillMode != null && { fillMode }) };
        commit(tmp);
    }, [getPalette, commit]);

    // --- Popover handlers ---

    const handleOpenPopover = useCallback((prefix: string, index: number, el: HTMLElement) => {
        setPopover({ prefix, index, anchorEl: el });
    }, []);

    const handleClosePopover = useCallback(() => {
        setPopover(null);
    }, []);

    // Resolve the popover color from current palette state
    const popoverRgba = useMemo(() => {
        if (!popover) return null;
        const ctrl = localPalette[popover.prefix] as PaletteControl | undefined;
        if (!ctrl || ctrl.type !== 'color') return null;
        return ctrl.value[popover.index] ?? null;
    }, [popover, localPalette]);

    // --- Render ---

    const entries = Object.entries(localPalette);

    return (
        <div className="vep-cssvar">
            {/* Header */}
            <div className="vep-cssvar__header">
                <span className="vep-cssvar__title">Variables</span>
                <div className="vep-cssvar__add-wrap" ref={addMenuRef}>
                    <button
                        className="vep-cssvar__add-btn"
                        onClick={() => setAddMenuOpen(v => !v)}
                    >
                        <i className="bi bi-plus" />
                    </button>
                    {addMenuOpen && (
                        <div className="vep-cssvar__add-menu">
                            <button onClick={() => addControl('color')}>
                                <i className="bi bi-palette" /> Palette
                            </button>
                            <button onClick={() => addControl('number')}>
                                <i className="bi bi-123" /> Number
                            </button>
                            <button onClick={() => addControl('text')}>
                                <i className="bi bi-fonts" /> Text
                            </button>
                            <button onClick={() => addControl('path')}>
                                <i className="bi bi-bezier2" /> Path
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Variable rows */}
            <div className="vep-cssvar__list">
                {entries.length === 0 && (
                    <div className="vep-cssvar__empty">No variables defined</div>
                )}
                {entries.map(([prefix, control]) => {
                    const ctrl = control as PaletteControl | NumberControl | StringControl | PathControl;
                    return (
                        <div key={prefix} className="vep-cssvar__row">
                            {/* Variable name */}
                            <input
                                className="vep-cssvar__name"
                                defaultValue={prefix}
                                onBlur={e => renamePrefix(prefix, e.target.value)}
                                spellCheck={false}
                            />

                            {/* Control body based on type */}
                            {ctrl.type === 'color' && (
                                <div className="vep-cssvar__colors">
                                    {(ctrl as PaletteControl).value.map((rgba, i) => (
                                        <ColorDot
                                            key={`${prefix}-${i}`}
                                            rgba={rgba}
                                            isPopoverOpen={
                                                popover?.prefix === prefix && popover?.index === i
                                            }
                                            onOpenPopover={(el) => handleOpenPopover(prefix, i, el)}
                                        />
                                    ))}
                                    <button
                                        className="vep-cssvar__add-color"
                                        title="Add color stop"
                                        onClick={() => addColorStop(prefix)}
                                    >
                                        <i className="bi bi-plus" />
                                    </button>
                                </div>
                            )}

                            {ctrl.type === 'number' && (
                                <div className="vep-cssvar__number">
                                    <input
                                        type="number"
                                        className="vep-cssvar__num-input"
                                        defaultValue={(ctrl as NumberControl).value}
                                        onBlur={e => setNumberValue(prefix, +e.target.value || 0)}
                                    />
                                    <select
                                        className="vep-cssvar__unit-select"
                                        value={(ctrl as NumberControl).unit || 'px'}
                                        onChange={e => setNumberUnit(prefix, e.target.value)}
                                    >
                                        {['px', '%', 'em', 'rem', 'fr', 'vw', 'vh'].map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {ctrl.type === 'text' && (
                                <input
                                    className="vep-cssvar__text-input"
                                    defaultValue={(ctrl as StringControl).value}
                                    onBlur={e => setTextValue(prefix, e.target.value)}
                                    placeholder="value"
                                />
                            )}

                            {ctrl.type === 'path' && (
                                <div className="vep-cssvar__path">
                                    <input
                                        className="vep-cssvar__path-input"
                                        defaultValue={(ctrl as PathControl).value}
                                        onBlur={e => setPathValue(prefix, e.target.value)}
                                        placeholder="M 0 0 L 10 10"
                                        spellCheck={false}
                                    />
                                    <PathPreview
                                        pathString={(ctrl as PathControl).value}
                                        fillMode={(ctrl as PathControl).fillMode}
                                        onClick={() => setPathEditorPrefix(prefix)}
                                    />
                                </div>
                            )}

                            {/* Delete */}
                            <button
                                className="vep-cssvar__delete"
                                title="Remove variable"
                                onClick={() => removeControl(prefix)}
                            >
                                <i className="bi bi-trash3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Color Picker Popover */}
            {popover && popoverRgba && (
                <ColorPickerPopover
                    rgba={popoverRgba}
                    anchorEl={popover.anchorEl}
                    onColorChange={(hex) => setColorStop(popover.prefix, popover.index, hex)}
                    onOpacityChange={(alpha) => setColorOpacity(popover.prefix, popover.index, alpha)}
                    onAddColor={(rgba) => addColorStop(popover.prefix, rgba)}
                    onDelete={() => {
                        removeColorStop(popover.prefix, popover.index);
                        setPopover(null);
                    }}
                    onClose={handleClosePopover}
                />
            )}

            {/* Path Editor Modal */}
            {pathEditorPrefix != null && (
                <PathEditorModal
                    isOpen
                    onClose={() => setPathEditorPrefix(null)}
                    pathString={(localPalette[pathEditorPrefix] as PathControl)?.value ?? ''}
                    initialFillMode={(localPalette[pathEditorPrefix] as PathControl)?.fillMode ?? 'outline'}
                    onPathChange={(newPath, fillMode) => setPathValue(pathEditorPrefix, newPath, fillMode)}
                />
            )}
        </div>
    );
};

export default CssVariablesEditor;
