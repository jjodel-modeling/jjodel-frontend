/**
 * SymbolBoxPreview — realistic preview of the Symbol modal strip (D8 wiring).
 *
 * Draws the current scalar axes at the real proportions of the box the
 * content-driven size produced for the canvas node (or the manual size when a
 * resize won). The box is a FACT read from the canvas (useCanvasNodeBox),
 * never recomputed here: the sizing engine is consumed, not duplicated.
 *
 * Rendering mirrors the real painters so preview and canvas cannot diverge in
 * kind: double is the same two-stroke overdraw IRNodeContent uses, dashes come
 * from SVG_BORDER_DASH, the marker is the registry glyph scaled the way
 * .ir-marker-svg scales it (min(w, h), centred), corner radii are the
 * irStyle.ts ones (4 on rect, 10 on rounded). Strokes are non-scaling-stroke
 * so a scaled-down box keeps a legible border; a large box scales DOWN to fit
 * the strip and never scales up.
 *
 * Pure presentation: no state, no model access, layout styles inline because
 * this component mounts only inside the modal strip. SymbolPreview (the 72x48
 * tile glyph) is untouched: catalog tiles, recents and the rail card render
 * exactly as before.
 */

import React from 'react';
import { MARKER_STROKE_WIDTH, getMarkerDef } from '../ir/markerRegistry';
import { SVG_BORDER_DASH } from '../ir/shapeRegistry';
import type { SymbolPreset } from '../ir/notationCatalog';

const STROKE = 'var(--color-text-primary, #334155)';
const BG = 'var(--node-bg, #ffffff)';

/** Inset of the contour from the viewBox edge, px (mockup: 2). */
const CONTOUR_INSET = 2;

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

/** The contour at the box proportions, as a reusable element for the double overdraw. */
function contourEl(
    form: SymbolPreset['values']['form'],
    w: number,
    h: number,
    props: React.SVGProps<any>,
): React.ReactElement {
    const i = CONTOUR_INSET;
    switch (form) {
        case 'rounded': return <rect x={i} y={i} width={w - 2 * i} height={h - 2 * i} rx={10} {...props} />;
        case 'ellipse': return <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - i} ry={h / 2 - i} {...props} />;
        case 'circle': return <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - i} {...props} />;
        case 'diamond': return <polygon points={`${w / 2},${i} ${w - i},${h / 2} ${w / 2},${h - i} ${i},${h / 2}`} {...props} />;
        case 'rect':
        default: return <rect x={i} y={i} width={w - 2 * i} height={h - 2 * i} rx={4} {...props} />;
    }
}

export interface SymbolBoxPreviewProps {
    preset: SymbolPreset;
    box: PreviewBox;
    label?: string;
    /** Stage bounds the preview must fit in, px. */
    maxW: number;
    maxH: number;
}

export const SymbolBoxPreview: React.FC<SymbolBoxPreviewProps> = ({ preset, box, label, maxW, maxH }) => {
    const v = preset.values;
    const style = v.border?.style ?? 'solid';
    const sw = v.border?.width ?? 1;
    const isDouble = style === 'double';
    const dash = SVG_BORDER_DASH[style];
    const fill = v.fill ?? BG;
    const markerDef = getMarkerDef(v.marker);
    const mk = Math.min(box.w, box.h) / 100;

    const s = fitScale(box, maxW, maxH);
    const dw = Math.max(1, Math.round(box.w * s));
    const dh = Math.max(1, Math.round(box.h * s));

    return (
        <div style={{ position: 'relative', width: dw, height: dh }}>
            <svg
                width={dw}
                height={dh}
                viewBox={`0 0 ${box.w} ${box.h}`}
                style={{ overflow: 'visible', display: 'block' }}
                aria-hidden="true"
                focusable="false"
            >
                {isDouble ? (
                    <>
                        {contourEl(v.form, box.w, box.h, {
                            fill, stroke: STROKE, strokeWidth: sw * 3, vectorEffect: 'non-scaling-stroke',
                        })}
                        {contourEl(v.form, box.w, box.h, {
                            fill: 'none', stroke: fill, strokeWidth: sw, vectorEffect: 'non-scaling-stroke',
                        })}
                    </>
                ) : (
                    contourEl(v.form, box.w, box.h, {
                        fill, stroke: STROKE, strokeWidth: sw, strokeDasharray: dash, vectorEffect: 'non-scaling-stroke',
                    })
                )}
                {markerDef && (
                    <g transform={`translate(${(box.w - 100 * mk) / 2}, ${(box.h - 100 * mk) / 2}) scale(${mk})`}>
                        {markerDef.paths.map((p, i) => (
                            <path
                                key={i}
                                d={p.d}
                                fill={p.fill ? STROKE : 'none'}
                                stroke={p.fill ? 'none' : STROKE}
                                strokeWidth={MARKER_STROKE_WIDTH}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}
                    </g>
                )}
            </svg>
            {label ? (
                <span
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: box.w,
                        height: box.h,
                        transform: `scale(${s})`,
                        transformOrigin: 'top left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        padding: '0 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: STROKE,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    {label}
                </span>
            ) : null}
        </div>
    );
};

export default SymbolBoxPreview;
