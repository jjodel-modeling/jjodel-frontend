import React, { useState, useCallback, useRef, useEffect } from 'react';
import tinycolor from 'tinycolor2';
import type { LViewElement } from '../../../../joiner';
import type {
    PaletteType,
    PaletteControl,
    NumberControl,
    StringControl,
    PathControl,
} from '../../../../view/viewElement/view';

interface CssVariablesEditorProps {
    view: LViewElement;
    onViewUpdate: () => void;
}

type ControlType = 'color' | 'number' | 'text' | 'path';

/** Tiny inline color dot that opens a native color picker on click. */
const ColorDot: React.FC<{
    rgba: tinycolor.ColorFormats.RGBA;
    onChange: (hex: string) => void;
    onRemove: () => void;
}> = ({ rgba, onChange, onRemove }) => {
    const color = tinycolor(rgba);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <span className="vep-cssvar__dot-wrap">
            <span
                className="vep-cssvar__dot"
                style={{ background: color.toRgbString() }}
                title={color.toHexString()}
                onClick={() => inputRef.current?.click()}
            />
            <input
                ref={inputRef}
                type="color"
                className="vep-cssvar__dot-input"
                value={color.toHexString()}
                onChange={e => onChange(e.target.value)}
            />
            <button
                className="vep-cssvar__dot-remove"
                title="Remove color"
                onClick={onRemove}
            >
                <i className="bi bi-x" />
            </button>
        </span>
    );
};

const CssVariablesEditor: React.FC<CssVariablesEditorProps> = ({ view, onViewUpdate }) => {
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);

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

    // --- Palette mutation helpers (mirrors PaletteData logic) ---

    const getPalette = useCallback((): PaletteType => ({ ...view.palette }), [view]);

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
        view.palette = tmp;
        onViewUpdate();
        setAddMenuOpen(false);
    }, [view, getPalette, onViewUpdate]);

    const removeControl = useCallback((prefix: string) => {
        const tmp = getPalette();
        delete tmp[prefix];
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const renamePrefix = useCallback((oldPrefix: string, newPrefix: string) => {
        const sanitized = newPrefix.replace(/[^\w\-]/g, '-');
        const palette = getPalette();
        if (!sanitized || sanitized === oldPrefix || palette[sanitized]) return;
        const tmp: PaletteType = {};
        for (const [k, v] of Object.entries(palette)) {
            tmp[k === oldPrefix ? sanitized : k] = v;
        }
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const addColorStop = useCallback((prefix: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const newColor = tinycolor('#94a3b8').toRgb();
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value: [...ctrl.value, newColor] };
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

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
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const removeColorStop = useCallback((prefix: string, index: number) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as PaletteControl;
        if (!ctrl || ctrl.type !== 'color') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value: ctrl.value.filter((_, i) => i !== index) };
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const setNumberValue = useCallback((prefix: string, value: number) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as NumberControl;
        if (!ctrl || ctrl.type !== 'number') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value };
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const setNumberUnit = useCallback((prefix: string, unit: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as NumberControl;
        if (!ctrl || ctrl.type !== 'number') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, unit } as NumberControl;
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    const setTextValue = useCallback((prefix: string, value: string) => {
        const palette = getPalette();
        const ctrl = palette[prefix] as StringControl;
        if (!ctrl || ctrl.type !== 'text') return;
        const tmp = { ...palette };
        tmp[prefix] = { ...ctrl, value };
        view.palette = tmp;
        onViewUpdate();
    }, [view, getPalette, onViewUpdate]);

    // --- Render ---

    const palette = view.palette || {};
    const entries = Object.entries(palette);

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
                                            onChange={hex => setColorStop(prefix, i, hex)}
                                            onRemove={() => removeColorStop(prefix, i)}
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
                                <span className="vep-cssvar__path-badge">
                                    <i className="bi bi-bezier2" /> path
                                </span>
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
        </div>
    );
};

export default CssVariablesEditor;
