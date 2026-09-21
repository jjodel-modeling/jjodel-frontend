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
 * Declared limit, narrowed in slice 5: the CONDITIONAL AXES are now per instance,
 * because the caller resolves them — `previewInstances.ts` evaluates form, fill,
 * border and marker against one instance through the same `ReadCtx` the canvas uses,
 * and hands the result down as the preset VALUE plus the caption below. This
 * component still resolves nothing and reads no model; it draws what it is given, one
 * instance per mount. What remains out is per-instance CONTENT — compartment rows,
 * badge visibility, the label: the tile shows the view's label, not the clone of one
 * node, and the strip is not a real IR render (D8). A large box scales DOWN to fit
 * the strip and never scales up.
 *
 * Pure presentation: no state, no model access. SymbolPreview (the 72x48 tile
 * glyph) is untouched: catalog tiles, recents and the rail card render exactly
 * as before.
 */

import React from 'react';
import { MARKER_STROKE_WIDTH, MARKER_VIEWBOX, getMarkerDef } from '../ir/markerRegistry';
import { SVG_BORDER_DASH, getShapeDescriptor, resolveCornerRadius, roundedPolygonPath } from '../ir/shapeRegistry';
import type { SymbolPreset } from '../ir/notationCatalog';

/**
 * Width of the box border `.ir-node-content` always carries (irStyle.ts, `border: 1px
 * solid`; the svg-painted forms only make it transparent). The SVG layer sits inside
 * it, so the rounded path is computed on the box minus this border on each side,
 * which is the box the canvas painter measures on its own `<svg>`.
 */
const BOX_BORDER_PX = 1;

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
    /**
     * Authored `ShapeSpec.cornerRadius`, px (slice 3). Travels separately for the same
     * reason as the border color: it is not a preset axis. Absent = the form's base
     * radius, exactly as on the canvas.
     */
    cornerRadius?: number;
    /** Stage bounds the preview must fit in, px. */
    maxW: number;
    maxH: number;
    /**
     * One line under the box (slice 5, D8-a): the size caption, or `<instance> ·
     * <predicate>` on a section whose axis carries rules. Composed by the caller
     * (`previewInstances.captionForInstance`), never derived here. Absent = no line,
     * and the tile is exactly the scaled box, as before.
     */
    caption?: string;
}

export const SymbolBoxPreview: React.FC<SymbolBoxPreviewProps> = ({ preset, box, label, borderColor, cornerRadius, maxW, maxH, caption }) => {
    const v = preset.values;
    const desc = getShapeDescriptor(v.form);
    // Entrambi i painter SVG, con la stessa narrowing di IRNodeContent: una forma
    // `svgPath` (il cilindro, la nuvola) porta il contorno in `silhouette` invece
    // che in `points`. Senza questo ramo irStyle.ts spegne la box CSS e nessuno
    // disegna la sagoma, cioe' la replica esce vuota.
    const painter = desc.painter;
    const svgPainter = painter.kind === 'svg' || painter.kind === 'svgPath' ? painter : null;
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

    // Corner radius (slice 3): the same decision and the same painter as IRNodeContent,
    // on a box that is known here instead of measured. CSS forms clamp on the border box,
    // the polygons on the SVG layer inside the border (BOX_BORDER_PX).
    const cornerPaint = resolveCornerRadius(
        v.form,
        cornerRadius,
        svgPainter ? { w: box.w - 2 * BOX_BORDER_PX, h: box.h - 2 * BOX_BORDER_PX } : box,
    );
    if (cornerPaint.kind === 'css') replicaStyle.borderRadius = cornerPaint.px;
    const roundedD = cornerPaint.kind === 'path' && svgPainter?.kind === 'svg'
        ? roundedPolygonPath(svgPainter.points, cornerPaint.r, cornerPaint.w, cornerPaint.h)
        : '';
    const svgViewBox = roundedD && cornerPaint.kind === 'path' ? `0 0 ${cornerPaint.w} ${cornerPaint.h}` : '0 0 100 100';
    /** The outline: the rounded path when there is one, the registry contour otherwise. */
    const outline = (props: { fill: string; stroke: string; strokeWidth: number; strokeDasharray?: string }) => {
        if (roundedD) return <path d={roundedD} vectorEffect="non-scaling-stroke" {...props} />;
        if (!svgPainter) return null;
        return svgPainter.kind === 'svgPath'
            ? <path d={svgPainter.silhouette} vectorEffect="non-scaling-stroke" {...props} />
            : <polygon points={svgPainter.points} vectorEffect="non-scaling-stroke" {...props} />;
    };

    return (
        <div className="symbol-box-preview">
            <div className="symbol-box-preview__stage" style={{ width: dw, height: dh }} aria-hidden="true">
                <div className={`ir-node-content ir-shape--${v.form}`} style={replicaStyle}>
                    {svgPainter && (
                        <svg className={svgPainter.svgClassName} viewBox={svgViewBox} preserveAspectRatio="none">
                            {svgDouble ? (
                                <>
                                    {outline({ fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth * 3 })}
                                    {outline({ fill: 'none', stroke: svgFill, strokeWidth: svgStrokeWidth })}
                                </>
                            ) : (
                                outline({ fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth, strokeDasharray: svgDash })
                            )}
                            {/* Ornamenti (il coperchio del cilindro): sopra la
                                silhouette, solo tratto, come su IRNodeContent. */}
                            {svgPainter.kind === 'svgPath' && (svgPainter.ornaments ?? []).map((d, i) => (
                                <path
                                    key={`ir-ornament-${i}`}
                                    d={d}
                                    vectorEffect="non-scaling-stroke"
                                    fill="none"
                                    stroke={svgStroke}
                                    strokeWidth={svgStrokeWidth}
                                    strokeDasharray={svgDash}
                                />
                            ))}
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
            {caption ? <span className="symbol-box-preview__caption">{caption}</span> : null}
        </div>
    );
};

export default SymbolBoxPreview;
