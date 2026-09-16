/**
 * SymbolPreview — anteprima SVG di un SymbolPreset del catalogo (D10).
 *
 * Disegna il punto nello spazio degli assi (contorno, bordo, marker, fill) in
 * un viewBox 72x48, con i token del tema (var(--node-bg), var(--color-text-primary))
 * cosi' l'anteprima segue light/dark. Il double e' reso con lo stesso overdraw
 * del motore (tratto largo nel colore del bordo, tratto stretto nel colore del
 * fill); i marker riusano i path di markerRegistry riscalati, quindi anteprima
 * e resa reale non possono divergere.
 *
 * Componente puro di presentazione: nessuno stato, nessun accesso al modello.
 */

import React from 'react';
import { MARKER_STROKE_WIDTH, getMarkerDef } from '../ir/markerRegistry';
import type { SymbolPreset } from '../ir/notationCatalog';
import { authoredCornerRadius, clampCornerRadius, roundedPolygonPath } from '../ir/shapeRegistry';

const VB_W = 72;
const VB_H = 48;
const CX = VB_W / 2;
const CY = VB_H / 2;

/** Scala dei glifi marker dal loro viewBox 0..100 all'anteprima. */
const MARKER_SCALE = 0.22;

const STROKE = 'var(--color-text-primary, #334155)';
const BG = 'var(--node-bg, #ffffff)';

/**
 * Canvas px to tile units for the corner radius. Not a new constant: the tile already
 * draws `rounded` with `rx={7}` against the 10px of irStyle.ts, and this is that ratio.
 */
const TILE_RADIUS_RATIO = 0.7;

/**
 * La nuvola dentro il riquadro della tile (x 10..62, y 8..40, come le altre
 * forme). E' la silhouette del registry portata li': quella vive nel viewBox
 * 0..100, quindi le otto gobbe circolari diventano archi ellittici, rx = 14.7 *
 * 0.52 e ry = 14.7 * 0.32. Stessa figura del canvas, non un secondo disegno.
 */
const CLOUD_TILE_PATH =
    'M54.26,28.65 A7.64,4.7 0 0 1 43.56,35.24 A7.64,4.7 0 0 1 28.44,35.24'
    + ' A7.64,4.7 0 0 1 17.74,28.65 A7.64,4.7 0 0 1 17.74,19.35'
    + ' A7.64,4.7 0 0 1 28.44,12.76 A7.64,4.7 0 0 1 43.56,12.76'
    + ' A7.64,4.7 0 0 1 54.26,19.35 A7.64,4.7 0 0 1 54.26,28.65 Z';

/**
 * Il contorno del preset, come elemento SVG riusabile per l'overdraw del double.
 *
 * `radius` (slice 3) is the authored corner radius already in tile units, or
 * `undefined` when not written. It is clamped per contour to a quarter of that
 * contour's shorter side, the canvas rule. The forms that ignore the axis do not read it.
 */
function contourEl(form: SymbolPreset['values']['form'], props: React.SVGProps<any>, radius?: number): React.ReactElement {
    // The tile polygons are written in absolute tile coordinates, not in the registry's
    // 0..100 space, so roundedPolygonPath gets w = h = 100: the identity scale.
    const polygon = (points: string, boxW: number, boxH: number) => {
        const r = radius !== undefined ? clampCornerRadius(radius, boxW, boxH) : 0;
        return r > 0
            ? <path d={roundedPolygonPath(points, r, 100, 100)} {...props} />
            : <polygon points={points} {...props} />;
    };
    const rectRx = (fallback: number | undefined) => (radius !== undefined ? clampCornerRadius(radius, 52, 32) : fallback);
    switch (form) {
        case 'rounded': return <rect x={10} y={8} width={52} height={32} rx={rectRx(7)} {...props} />;
        case 'ellipse': return <ellipse cx={CX} cy={CY} rx={26} ry={16} {...props} />;
        case 'circle': return <circle cx={CX} cy={CY} r={16} {...props} />;
        case 'diamond': return polygon(`${CX},4 ${VB_W - 6},${CY} ${CX},${VB_H - 4} 6,${CY}`, 60, 40);
        case 'stadium': return <rect x={10} y={8} width={52} height={32} rx={16} {...props} />;
        case 'hexagon': return polygon('23,8 49,8 62,24 49,40 23,40 10,24', 52, 32);
        case 'parallelogram': return polygon('23,8 62,8 49,40 10,40', 52, 32);
        // Il cilindro e' due elementi: la silhouette e il coperchio, che non va
        // mai riempito. Gli attributi di presentazione stanno sul gruppo e i
        // figli ereditano, cosi' l'overdraw del double resta una sola chiamata.
        case 'cylinder': return (
            <g {...props}>
                <path d="M10,14 A26,6 0 0 1 62,14 L62,34 A26,6 0 0 1 10,34 Z" />
                <path d="M10,14 A26,6 0 0 0 62,14" fill="none" />
            </g>
        );
        // La nuvola e' un path solo, chiuso e senza ornamenti: l'overdraw del
        // double la ridisegna tale e quale, come per i poligoni.
        case 'cloud': return <path d={CLOUD_TILE_PATH} {...props} />;
        case 'rect':
        default: return <rect x={10} y={8} width={52} height={32} rx={rectRx(undefined)} {...props} />;
    }
}

export interface SymbolPreviewProps {
    preset: SymbolPreset;
    /** Larghezza in px; l'altezza segue il rapporto 72:48. */
    width?: number;
    /**
     * Authored `ShapeSpec.cornerRadius` in canvas px (slice 3). A prop and not a field of
     * `SymbolPreset.values`: catalog presets carry no radius. Only the Symbol modal
     * passes it; catalog tiles and the rail card render as before.
     */
    cornerRadius?: number;
}

export const SymbolPreview: React.FC<SymbolPreviewProps> = ({ preset, width = 56, cornerRadius }) => {
    const v = preset.values;
    const authored = authoredCornerRadius(cornerRadius);
    const tileRadius = authored !== undefined ? authored * TILE_RADIUS_RATIO : undefined;
    const style = v.border?.style ?? 'solid';
    const isDouble = style === 'double';
    // Legibilita' in miniatura: normale ~1.25, spesso ~2.5.
    const sw = (v.border?.width ?? 1) >= 3 ? 2.5 : 1.25;
    const dash = style === 'dashed' ? '4 3' : style === 'dotted' ? '1 3' : undefined;
    const fill = v.fill ?? BG;
    const markerDef = getMarkerDef(v.marker);

    return (
        <svg
            width={width}
            height={Math.round((width * VB_H) / VB_W)}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            aria-hidden="true"
            focusable="false"
        >
            {isDouble ? (
                <>
                    {contourEl(v.form, { fill, stroke: STROKE, strokeWidth: 3.5 }, tileRadius)}
                    {contourEl(v.form, { fill: 'none', stroke: fill, strokeWidth: 1.25 }, tileRadius)}
                </>
            ) : (
                contourEl(v.form, { fill, stroke: STROKE, strokeWidth: sw, strokeDasharray: dash }, tileRadius)
            )}
            {markerDef && (
                <g transform={`translate(${CX - 50 * MARKER_SCALE}, ${CY - 50 * MARKER_SCALE}) scale(${MARKER_SCALE})`}>
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
    );
};

export default SymbolPreview;
