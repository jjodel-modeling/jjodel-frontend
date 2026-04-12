import React, {Dispatch, ReactElement, ReactNode, useCallback, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {Defaults, DPointerTargetable, GObject, LPointerTargetable, Overlap, Pointer} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import tinycolor from 'tinycolor2';
import './color.scss';


// ── HSV ↔ Hex helpers ────────────────────────────────────────
function hexToHsv(hex: string) {
    const hsv = tinycolor(hex).toHsv();
    return { h: hsv.h, s: hsv.s * 100, v: hsv.v * 100 };
}

function hsvToHex(h: number, s: number, v: number) {
    return tinycolor({ h, s: s / 100, v: v / 100 }).toHexString();
}


// ── Inline HSV color picker (SV canvas + hue slider + RGB) ──
function ColorPickerArea(props: { color: string; onChange: (hex: string) => void; readOnly?: boolean }) {
    const { color, onChange, readOnly } = props;
    const svRef = useRef<HTMLDivElement>(null);
    const hsv = hexToHsv(color || '#000000');
    const rgb = tinycolor(color || '#000000').toRgb();

    const updateSV = useCallback((clientX: number, clientY: number) => {
        if (readOnly || !svRef.current) return;
        const rect = svRef.current.getBoundingClientRect();
        const s = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        const v = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100));
        onChange(hsvToHex(hsv.h, s, v));
    }, [hsv.h, onChange, readOnly]);

    const handleSVMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        updateSV(e.clientX, e.clientY);
        const move = (ev: MouseEvent) => updateSV(ev.clientX, ev.clientY);
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }, [updateSV]);

    return (
        <>
            {/* SV canvas */}
            <div
                ref={svRef}
                className="cpanel__sv"
                style={{ background: `linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))` }}
                onMouseDown={handleSVMouseDown}
            >
                <div className="cpanel__sv-dark" />
                <div className="cpanel__sv-cursor" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
            </div>

            {/* Hue slider */}
            <input
                type="range" className="cpanel__hue"
                min={0} max={360} value={Math.round(hsv.h)}
                onChange={e => { if (!readOnly) onChange(hsvToHex(+e.target.value, hsv.s, hsv.v)); }}
                disabled={readOnly}
            />

            {/* HEX + RGB inputs */}
            <div className="cpanel__inputs">
                <div className="cpanel__input-group cpanel__input-group--hex">
                    <input
                        type="text" value={tinycolor(color).toHexString()} spellCheck={false}
                        onChange={e => { const v = e.target.value; if (!readOnly && tinycolor(v).isValid()) onChange(tinycolor(v).toHexString()); }}
                        disabled={readOnly}
                    />
                    <span>HEX</span>
                </div>
                {(['r', 'g', 'b'] as const).map(ch => (
                    <div key={ch} className="cpanel__input-group">
                        <input
                            type="number" min={0} max={255} value={rgb[ch]}
                            onChange={e => { if (!readOnly) onChange(tinycolor({ ...rgb, [ch]: Math.max(0, Math.min(255, +e.target.value)) }).toHexString()); }}
                            disabled={readOnly}
                        />
                        <span>{ch.toUpperCase()}</span>
                    </div>
                ))}
            </div>
        </>
    );
}


// ── Portal-rendered unified panel ────────────────────────────
function ColorPanel(props: {
    color: string;
    onChange: (hex: string) => void;
    readOnly?: boolean;
    anchorRef: React.RefObject<HTMLDivElement | null>;
    childrenn?: any;
    onClose: () => void;
}) {
    const { color, onChange, readOnly, anchorRef, childrenn, onClose } = props;
    const panelRef = useRef<HTMLDivElement>(null);

    // Position: fixed below the anchor swatch
    const rect = anchorRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + 4;
    const left = (rect ? rect.left + rect.width / 2 : 0) - 130; // center 260px panel

    // Click outside closes
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)
                && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, anchorRef]);

    return createPortal(
        <div
            ref={panelRef}
            className="cpanel"
            style={{ top, left: Math.max(4, left) }}
            onClick={e => e.stopPropagation()}
        >
            <ColorPickerArea color={color} onChange={onChange} readOnly={readOnly} />
            <div className="cpanel__divider" />
            {/* Opacity + Analogous/Lighten/Darken/... + Delete (from PaletteData childrenn) */}
            {childrenn}
        </div>,
        document.body
    );
}


// ── Main Color component ─────────────────────────────────────
function ColorComponent(props: AllProps) {
    const [pinned, setPinned] = useStateIfMounted(false);
    const swatchRef = useRef<HTMLDivElement>(null);

    if (!props.data && (!props.getter || !props.setter)) return <></>;

    const getter = props.getter || (() => props.data[props.field]);
    const setter = props.setter || ((value: string) => { props.data[props.field] = value; });
    const readOnly = (props.readOnly !== undefined) ? props.readOnly : props.debugmodee !== 'true' && Defaults.check(props.data.id);
    const currentColor = getter(props.data, props.field) || '#000000';

    const handleColorChange = useCallback((hex: string) => {
        if (!readOnly) setter(hex);
    }, [readOnly, setter]);

    const handleSwatchClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setPinned(prev => !prev);
    }, [setPinned]);

    return (
        <div
            ref={swatchRef}
            className={(props.className ? props.className : 'color-picker-root') + (pinned ? ' pinned' : '')}
            style={{ cursor: 'pointer', ...((props as any).style || {}) }}
        >
            {/* Color swatch */}
            <div
                className="jj-color-swatch"
                style={{ backgroundColor: currentColor, opacity: props.inputStyle?.opacity ?? 1 }}
                title={currentColor}
                onClick={handleSwatchClick}
            />

            {/* Portal-rendered panel */}
            {pinned && (
                <ColorPanel
                    color={currentColor}
                    onChange={handleColorChange}
                    readOnly={readOnly}
                    anchorRef={swatchRef}
                    childrenn={props.childrenn}
                    onClose={() => setPinned(false)}
                />
            )}
        </div>
    );
}

export interface InputOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    getter?: (data: LPointerTargetable, field: string) => string;
    setter?: (value: string) => void;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
        'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    className?: string;
    style?: GObject;
    readOnly?: boolean;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    key?: React.Key | null;
    canDelete?: boolean;
    children?: any;
    childrenn?: any;
}
interface StateProps {
    debugmodee: string;
    data: LPointerTargetable & GObject;
}
interface DispatchProps { }
type AllProps = Overlap<InputOwnProps, Overlap<StateProps, DispatchProps>>;

function mapStateToProps(state: DState, ownProps: InputOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmodee = state.debug ? 'true' : 'false';
    ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    return {};
}

export const ColorConnected =
    connect<StateProps, DispatchProps, InputOwnProps, DState>(mapStateToProps, mapDispatchToProps)(ColorComponent);

export function Color(props: InputOwnProps, children: ReactNode = []): ReactElement {
    // @ts-ignore children
    return <ColorConnected {...{...props, children}} />;
}

ColorComponent.cname = 'ColorComponent';
ColorConnected.cname = 'ColorConnected';
Color.cname = 'Color';
