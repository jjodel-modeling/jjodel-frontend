/**
 * Editor V3 — Edge Marker Definitions.
 *
 * SVG marker shapes for all 7 edge kinds.
 * Each marker has a unique ID per edge instance to avoid style conflicts.
 */

export type MarkerShape = 'arrow' | 'hollow-triangle' | 'filled-diamond' | 'hollow-diamond' | 'open-arrow';

export interface MarkerDef {
    shape: MarkerShape;
    viewBox: string;
    refX: number;
    refY: number;
    width: number;
    height: number;
    path: string;
    /** CSS class for fill/stroke styling */
    className: string;
}

/** Arrow — open arrowhead (reference target) */
const ARROW: MarkerDef = {
    shape: 'arrow',
    viewBox: '0 0 10 10',
    refX: 10,
    refY: 5,
    width: 8,
    height: 8,
    path: 'M 0 0 L 10 5 L 0 10',
    className: 'v3-edge-marker v3-edge-marker--arrow',
};

/** Hollow triangle — inheritance target */
const HOLLOW_TRIANGLE: MarkerDef = {
    shape: 'hollow-triangle',
    viewBox: '0 0 12 10',
    refX: 12,
    refY: 5,
    width: 12,
    height: 10,
    path: 'M 0 0 L 12 5 L 0 10 Z',
    className: 'v3-edge-marker v3-edge-marker--hollow-triangle',
};

/** Filled diamond — composition source */
const FILLED_DIAMOND: MarkerDef = {
    shape: 'filled-diamond',
    viewBox: '0 0 12 8',
    refX: 0,
    refY: 4,
    width: 12,
    height: 8,
    path: 'M 0 4 L 6 0 L 12 4 L 6 8 Z',
    className: 'v3-edge-marker v3-edge-marker--filled-diamond',
};

/** Hollow diamond — aggregation source */
const HOLLOW_DIAMOND: MarkerDef = {
    shape: 'hollow-diamond',
    viewBox: '0 0 12 8',
    refX: 0,
    refY: 4,
    width: 12,
    height: 8,
    path: 'M 0 4 L 6 0 L 12 4 L 6 8 Z',
    className: 'v3-edge-marker v3-edge-marker--hollow-diamond',
};

/** Open arrow — dependency target (lighter than full arrow) */
const OPEN_ARROW: MarkerDef = {
    shape: 'open-arrow',
    viewBox: '0 0 10 10',
    refX: 10,
    refY: 5,
    width: 8,
    height: 8,
    path: 'M 0 2 L 10 5 L 0 8',
    className: 'v3-edge-marker v3-edge-marker--open-arrow',
};

/** All marker definitions indexed by shape */
export const MARKER_DEFS: Record<MarkerShape, MarkerDef> = {
    'arrow': ARROW,
    'hollow-triangle': HOLLOW_TRIANGLE,
    'filled-diamond': FILLED_DIAMOND,
    'hollow-diamond': HOLLOW_DIAMOND,
    'open-arrow': OPEN_ARROW,
};

export type EdgeKind = 'inheritance' | 'reference' | 'composition' | 'aggregation'
    | 'dependency' | 'instanceLink' | 'valueLink';

interface EdgeMarkerConfig {
    startMarker: MarkerShape | null;
    endMarker: MarkerShape | null;
    dashArray: string | undefined;
    cssClass: string;
}

/** Get marker configuration for a given edge kind */
export function getEdgeMarkerConfig(kind: EdgeKind): EdgeMarkerConfig {
    switch (kind) {
        case 'inheritance':
            return { startMarker: null, endMarker: 'hollow-triangle', dashArray: undefined, cssClass: 'v3-edge--inheritance' };
        case 'reference':
            return { startMarker: null, endMarker: 'arrow', dashArray: undefined, cssClass: 'v3-edge--reference' };
        case 'composition':
            return { startMarker: 'filled-diamond', endMarker: 'arrow', dashArray: undefined, cssClass: 'v3-edge--composition' };
        case 'aggregation':
            return { startMarker: 'hollow-diamond', endMarker: 'arrow', dashArray: undefined, cssClass: 'v3-edge--aggregation' };
        case 'dependency':
            return { startMarker: null, endMarker: 'open-arrow', dashArray: '6 3', cssClass: 'v3-edge--dependency' };
        case 'instanceLink':
            return { startMarker: null, endMarker: 'arrow', dashArray: '8 4', cssClass: 'v3-edge--instance-link' };
        case 'valueLink':
            return { startMarker: null, endMarker: null, dashArray: undefined, cssClass: 'v3-edge--value-link' };
    }
}

/** Generate unique marker ID for a given edge instance */
export function markerIdFor(edgeId: string, shape: MarkerShape): string {
    return `v3-marker-${shape}-${edgeId}`;
}
