import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isConditionalValue, type PathBuilderFeatures } from '../../../ui';
import { TextStyleEditor } from './TextStyleEditor';
import type { TextStyle } from '../ir/irTypes';

export interface TextStyleFieldProps {
    value: TextStyle | undefined;
    onChange: (next: TextStyle | undefined) => void;
    label?: string;
    /**
     * Passed through to the per-axis ConditionalEditor (predicate authoring in the
     * popover). Optional so TextStyleField stays generic for TS2/TS3; when omitted the
     * conditional PathBuilder is disabled (features null) exactly as ConditionalEditor
     * already handles. LabelEntryEditor forwards the real metaclass features here so the
     * conditional authoring shipped in e2368cad7 is not degraded.
     */
    features?: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames?: string[];
}

const FAMILY_LABEL: Record<string, string> = { sans: 'Sans', mono: 'Mono' };
const WEIGHT_LABEL: Record<string, string> = { normal: 'Normal', medium: 'Medium', semibold: 'Semibold', bold: 'Bold' };

interface SummarySeg { conditional: boolean; text: string; }
interface Summary { isDefault: boolean; segments: SummarySeg[]; swatch?: { conditional: boolean; color?: string }; }

/**
 * Pure summary of a TextStyle for the trigger row. Absent style / no axes -> "Default".
 * Otherwise only authored axes, in fixed order joined by " · "; a conditional axis shows
 * its short name (with a condition glyph) instead of the literal; color is a swatch pinned
 * right. fontStyle 'normal' (fixed) is omitted. `isConditionalValue` distinguishes a bare
 * value from a Conditional object.
 */
function summarizeTextStyle(style: TextStyle | undefined): Summary {
    if (!style || Object.keys(style).length === 0) return { isDefault: true, segments: [] };
    const segments: SummarySeg[] = [];
    let swatch: Summary['swatch'];

    const fam = style.fontFamily;
    if (fam !== undefined) {
        if (isConditionalValue(fam)) segments.push({ conditional: true, text: 'Font' });
        else segments.push({ conditional: false, text: FAMILY_LABEL[fam as string] ?? String(fam) });
    }
    const size = style.fontSize;
    if (size !== undefined) {
        if (isConditionalValue(size)) segments.push({ conditional: true, text: 'Size' });
        else segments.push({ conditional: false, text: `${size as number}px` });
    }
    const weight = style.fontWeight;
    if (weight !== undefined) {
        if (isConditionalValue(weight)) segments.push({ conditional: true, text: 'Weight' });
        else segments.push({ conditional: false, text: WEIGHT_LABEL[weight as string] ?? String(weight) });
    }
    const fstyle = style.fontStyle;
    if (fstyle !== undefined) {
        if (isConditionalValue(fstyle)) segments.push({ conditional: true, text: 'Style' });
        else if (fstyle === 'italic') segments.push({ conditional: false, text: 'Italic' });
        // fixed 'normal' -> omit (COME.4)
    }
    const color = style.color;
    if (color !== undefined) {
        if (isConditionalValue(color)) swatch = { conditional: true };
        else if (color) swatch = { conditional: false, color: color as string };
    }
    // Axes present but nothing visible (e.g. only fontStyle:'normal') -> avoid a blank trigger.
    if (segments.length === 0 && !swatch) segments.push({ conditional: false, text: 'Custom' });
    return { isDefault: false, segments, swatch };
}

const POPOVER_WIDTH = 300;

/** Fixed-positioned popover geometry from the trigger rect (portal to body). Flips
 *  above the trigger when the space below is insufficient; clamps to the viewport. */
function computePopoverStyle(rect: DOMRect): React.CSSProperties {
    const GAP = 4, MARGIN = 8, PREF = 260;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const openUp = spaceBelow < PREF && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, (openUp ? spaceAbove : spaceBelow) - GAP);
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - MARGIN));
    const base: React.CSSProperties = { left, width: POPOVER_WIDTH, maxHeight };
    return openUp
        ? { ...base, bottom: window.innerHeight - rect.top + GAP }
        : { ...base, top: rect.bottom + GAP };
}

/**
 * TextStyleField (ir-1.3 TS1, UX refactor) — compact trigger with a live summary of the
 * authored TextStyle; on click opens the existing TextStyleEditor inside a portal popover
 * (no layout shift, robust against panel overflow clipping). Wrapper only: value/onChange
 * are forwarded verbatim to TextStyleEditor (its per-axis logic and undefined-collapse are
 * unchanged). Presentational: flat data props, design-system tokens.
 */
export const TextStyleField: React.FC<TextStyleFieldProps> = ({
    value,
    onChange,
    label = 'Style',
    features = null,
    featuresHint,
    classNames = [],
}) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // While open: close on outside-click, Esc, and scroll of any ancestor (capture) —
    // scroll inside the popover itself is ignored so the conditional editor can scroll.
    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        const onScroll = (e: Event) => {
            if (popoverRef.current?.contains(e.target as Node)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onKey, true);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('keydown', onKey, true);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    const summary = summarizeTextStyle(value);
    const popStyle = open && triggerRef.current
        ? computePopoverStyle(triggerRef.current.getBoundingClientRect())
        : undefined;

    return (
        <div className="jj-field jj-textstyle-field">
            <label className="jj-field-label">{label}</label>
            <button
                type="button"
                ref={triggerRef}
                className="jj-textstyle-field__trigger"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
            >
                <span className="jj-textstyle-summary">
                    {summary.isDefault
                        ? <span className="jj-textstyle-summary__default">Default</span>
                        : summary.segments.map((seg, i) => (
                            <span key={i} className="jj-textstyle-summary__seg">
                                {i > 0 && <span className="jj-textstyle-summary__sep">·</span>}
                                {seg.conditional && <i className="bi bi-lightning-charge" aria-hidden="true" />}
                                {seg.text}
                            </span>
                        ))}
                </span>
                {summary.swatch && (
                    summary.swatch.conditional
                        ? <span className="jj-textstyle-swatch jj-textstyle-swatch--conditional" title="Conditional color"><i className="bi bi-lightning-charge" aria-hidden="true" /></span>
                        : <span className="jj-textstyle-swatch" style={{ background: summary.swatch.color }} title={summary.swatch.color} />
                )}
                <i className="bi bi-chevron-down jj-textstyle-field__caret" aria-hidden="true" />
            </button>

            {open && popStyle && createPortal(
                <div ref={popoverRef} className="jj-textstyle-popover" style={popStyle}>
                    <div className="jj-textstyle-popover__header">
                        <span className="jj-textstyle-popover__title">Typography</span>
                        <button
                            type="button"
                            className="jj-textstyle-popover__reset"
                            onClick={() => onChange(undefined)}
                            disabled={summary.isDefault}
                            title="Reset to default"
                        >
                            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="jj-textstyle-popover__body">
                        <TextStyleEditor
                            value={value}
                            onChange={onChange}
                            features={features}
                            featuresHint={featuresHint}
                            classNames={classNames}
                        />
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
};

export default TextStyleField;
