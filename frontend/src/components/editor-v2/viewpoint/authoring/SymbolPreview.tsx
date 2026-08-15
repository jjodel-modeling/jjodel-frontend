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

const VB_W = 72;
const VB_H = 48;
const CX = VB_W / 2;
const CY = VB_H / 2;

/** Scala dei glifi marker dal loro viewBox 0..100 all'anteprima. */
const MARKER_SCALE = 0.22;

const STROKE = 'var(--color-text-primary, #334155)';
const BG = 'var(--node-bg, #ffffff)';

/** Il contorno del preset, come elemento SVG riusabile per l'overdraw del double. */
function contourEl(form: SymbolPreset['values']['form'], props: React.SVGProps<any>): React.ReactElement {
    switch (form) {
        case 'rounded': return <rect x={10} y={8} width={52} height={32} rx={7} {...props} />;
        case 'ellipse': return <ellipse cx={CX} cy={CY} rx={26} ry={16} {...props} />;
        case 'circle': return <circle cx={CX} cy={CY} r={16} {...props} />;
        case 'diamond': return <polygon points={`${CX},4 ${VB_W - 6},${CY} ${CX},${VB_H - 4} 6,${CY}`} {...props} />;
        case 'stadium': return <rect x={10} y={8} width={52} height={32} rx={16} {...props} />;
        case 'hexagon': return <polygon points="23,8 49,8 62,24 49,40 23,40 10,24" {...props} />;
        case 'parallelogram': return <polygon points="23,8 62,8 49,40 10,40" {...props} />;
        // Il cilindro e' due elementi: la silhouette e il coperchio, che non va
        // mai riempito. Gli attributi di presentazione stanno sul gruppo e i
        // figli ereditano, cosi' l'overdraw del double resta una sola chiamata.
        case 'cylinder': return (
            <g {...props}>
                <path d="M10,14 A26,6 0 0 1 62,14 L62,34 A26,6 0 0 1 10,34 Z" />
                <path d="M10,14 A26,6 0 0 0 62,14" fill="none" />
            </g>
        );
        case 'rect':
        default: return <rect x={10} y={8} width={52} height={32} {...props} />;
    }
}

export interface SymbolPreviewProps {
    preset: SymbolPreset;
    /** Larghezza in px; l'altezza segue il rapporto 72:48. */
    width?: number;
}

export const SymbolPreview: React.FC<SymbolPreviewProps> = ({ preset, width = 56 }) => {
    const v = preset.values;
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
                    {contourEl(v.form, { fill, stroke: STROKE, strokeWidth: 3.5 })}
                    {contourEl(v.form, { fill: 'none', stroke: fill, strokeWidth: 1.25 })}
                </>
            ) : (
                contourEl(v.form, { fill, stroke: STROKE, strokeWidth: sw, strokeDasharray: dash })
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
