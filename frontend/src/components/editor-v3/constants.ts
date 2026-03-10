/**
 * Editor V3 — Shared constants.
 */

/** Maximum handles per side for the DynamicAnchors pool */
export const MAX_HANDLES_PER_SIDE = 4;

/** Distance in px from node edge within which a side is considered "hovered" */
export const HOVER_THRESHOLD = 15;

/** Anti-bounce window in ms — canvas-originated writes are skipped for this duration */
export const BOUNCE_WINDOW_MS = 300;

/** Default node dimensions when DVertex has no explicit size */
export const DEFAULT_NODE_WIDTH = 200;
export const DEFAULT_NODE_HEIGHT = 120;

/** Default grid size for snap-to-grid */
export const DEFAULT_GRID_SIZE = 20;

/** Minimum node dimensions */
export const MIN_NODE_WIDTH = 80;
export const MIN_NODE_HEIGHT = 40;

/** Graph style tag for V3 editor graphs */
export const V3_GRAPH_STYLE = 'v3-editor';

/** Graph style tag for V2 editor graphs (for coexistence) */
export const V2_GRAPH_STYLE = 'v2-flow';

/** Sides array for handle iteration */
export const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/** Columns for auto-layout when creating a new graph from model */
export const AUTO_LAYOUT_COLS = 3;
export const AUTO_LAYOUT_COL_WIDTH = 300;
export const AUTO_LAYOUT_ROW_HEIGHT = 220;
export const AUTO_LAYOUT_OFFSET = 50;
