/**
 * SymbolBoxPreview — realistic preview of the Symbol modal strip (D8 wiring).
 *
 * Renders the box the content-driven size produced (or the manual size when a
 * resize won) as a REPLICA of the canvas node: the same global classes
 * irStyle.ts injects (`ir-node-content ir-shape--<form>`, `ir-label`,
 * `ir-marker-svg`), the same inline border/fill emission as IRNodeContent, the
 * same SVG polygon overdraw for the svg-painted shapes. What the canvas paints
 * through CSS (dashed and double borders, radii, shadow, typography, ellipsis)
 * the preview paints identically by construction. The box itself is a FACT
 * read from the canvas (useCanvasNodeBox), never recomputed here: the sizing
 * engine is consumed, not duplicated.
 *
 * The replica sets min-width/min-height 0 inline: on the canvas an explicit
 * size lifts the 140x40 content-hug floors through `.mm-node.ir-sized`
 * (irStyle.ts); without a .mm-node ancestor the inline zeros reproduce exactly
 * that lifted state.
 *
 * Declared limit: per-instance content (compartment rows, conditional axes,
 * badge visibility) needs an instance and stays out; the preview is the view
 * with its label, not the clone of one node. A large box scales DOWN to fit
 * the strip and never scales up.
 *
 * Pure presentation: no state, no model access. SymbolPreview (the 72x48 tile
 * glyph) is untouched: catalog tiles, recents and the rail card render exactly
 * as before.
 */

import React from 'react';
import { MARKER_STROKE_WIDTH, MARKER_VIEWBOX, getMarkerDef } from '../ir/markerRegistry';
import { SVG_BORDER_DASH, getShapeDescriptor } from '../ir/shapeRegistry';
import type { SymbolPreset } from '../ir/notationCatalog';

/** Box dimensions in canvas pixels. */
export interface PreviewBox {
    readonly w: number;
    readonly h: number;
}

/**
 * Scale that fits `box` inside `maxW x maxH`: reduction only, never
 * enlargement (a box smaller than the stage renders 1:1). A degenerate box
 * falls back to 1 so the caller never divides by zero.
 */
export function fitScale(box: PreviewBox, maxW: number, maxH: number): number {
    if (!(box.w > 0) || !(box.h > 0)) return 1;
    return Math.min(1, maxW / box.w, maxH / box.h);
}

/**
 * Caption of the strip, per the approved mockup translated to the English UI:
 * `W × H px · derived from ink (D8)`, or `· manual size` when a manual resize
 * owns the box. Numbers are rounded for display only.
 */
export function captionForBox(box: PreviewBox, source: 'derived' | 'manual'): string {
    const tail = source === 'manual' ? 'manual size' : 'derived from ink (D8)';
    return `${Math.round(box.w)} × ${Math.round(box.h)} px · ${tail}`;
}

export interface SymbolBoxPreviewProps {
    preset: SymbolPreset;
    box: PreviewBox;
    label?: string;
    /**
     * Authored border color of the view. It travels separately because the
     * preset VALUE cannot carry it: recognition (D14) deliberately ignores the
     * border color, so `currentAxesPreset` strips it. Absent = the canvas
     * default, exactly as IRNodeContent falls back.
     */
    borderColor?: string;
    /** Stage bounds the preview must fit in, px. */
    maxW: number;
    maxH: number;
}

export const SymbolBoxPreview: React.FC<SymbolBoxPreviewProps> = ({ preset, box, label, borderColor, maxW, maxH }) => {
    const v = preset.values;
    const desc = getShapeDescriptor(v.form);
    const svgPainter = desc.painter.kind === 'svg' ? desc.painter : null;
    const markerDef = getMarkerDef(v.marker);

    const s = fitScale(box, maxW, maxH);
    const dw = Math.max(1, Math.round(box.w * s));
    const dh = Math.max(1, Math.round(box.h * s));

    // Same inline emission as IRNodeContent: border and background only when
    // authored, and never for an svg-painted form (irStyle.ts suppresses the
    // CSS box there and the polygon carries the resolved values).
    const b = v.border;
    const replicaStyle: React.CSSProperties = {
        width: box.w,
        height: box.h,
        minWidth: 0,
        minHeight: 0,
        transform: `scale(${s})`,
        transformOrigin: 'top left',
    };
    if (!svgPainter) {
        if (v.fill) replicaStyle.background = v.fill;
        if (b) replicaStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${borderColor ?? 'var(--border-default)'}`;
    }
    const svgFill = v.fill || 'var(--node-bg)';
    const svgStroke = borderColor ?? 'var(--border-default)';
    const svgStrokeWidth = b?.width ?? 1;
    const svgDash = SVG_BORDER_DASH[b?.style ?? 'solid'];
    const svgDouble = (b?.style ?? 'solid') === 'double';
    const markerColor = borderColor ?? 'var(--border-default)';

    return (
        <div style={{ position: 'relative', width: dw, height: dh }} aria-hidden="true">
            <div className={`ir-node-content ir-shape--${v.form}`} style={replicaStyle}>
                {svgPainter && (
                    <svg className={svgPainter.svgClassName} viewBox="0 0 100 100" preserveAspectRatio="none">
                        {svgDouble ? (
                            <>
                                <polygon
                                    points={svgPainter.points}
                                    vectorEffect="non-scaling-stroke"
                                    fill={svgFill}
                                    stroke={svgStroke}
                                    strokeWidth={svgStrokeWidth * 3}
                                />
                                <polygon
                                    points={svgPainter.points}
                                    vectorEffect="non-scaling-stroke"
                                    fill="none"
                                    stroke={svgFill}
                                    strokeWidth={svgStrokeWidth}
                                />
                            </>
                        ) : (
                            <polygon
                                points={svgPainter.points}
                                vectorEffect="non-scaling-stroke"
                                fill={svgFill}
                                stroke={svgStroke}
                                strokeWidth={svgStrokeWidth}
                                strokeDasharray={svgDash}
                            />
                        )}
                    </svg>
                )}
                {markerDef && (
                    <svg className="ir-marker-svg" viewBox={MARKER_VIEWBOX} preserveAspectRatio="xMidYMid meet">
                        {markerDef.paths.map((p, i) => (
                            <path
                                key={i}
                                d={p.d}
                                fill={p.fill ? markerColor : 'none'}
                                stroke={p.fill ? 'none' : markerColor}
                                strokeWidth={MARKER_STROKE_WIDTH}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}
                    </svg>
                )}
                {label ? <span className="ir-label ir-label--center">{label}</span> : null}
            </div>
        </div>
    );
};

export default SymbolBoxPreview;
