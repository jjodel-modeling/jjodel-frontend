import { createContext, useContext, type ReactNode } from 'react';

/**
 * Highlight mode (figure-authoring) shared state.
 *
 * Manual multi-color tagging: in highlight mode the user picks an active color
 * (1..5) from the toolbar palette and clicks nodes / edges to tag them. State is
 * a flat `id -> colorIndex` map; everything untagged renders `hl-dimmed`.
 *
 * Render-time injection (Opzione B della discovery): node.data / edge.data and the
 * JjOM → RF transform are NOT touched — the consumer hooks return the CSS class.
 *
 * The map persists in localStorage keyed per model (`jjodel.highlight.${modelid}`);
 * it does NOT travel with the project file.
 */
export interface HighlightState {
    active: boolean;
    colorById: Record<string, number>;   // id (nodo o edge) -> indice colore 1..5
}

const EMPTY_HIGHLIGHT: HighlightState = {
    active: false,
    colorById: {},
};

export const HighlightContext = createContext<HighlightState>(EMPTY_HIGHLIGHT);

export function HighlightProvider({ value, children }: { value: HighlightState; children: ReactNode }) {
    return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

/**
 * CSS class for a node: '' when mode is off; otherwise `hl-c${n}` when the node
 * is tagged with color n, or 'hl-dimmed' when untagged.
 */
export function useNodeHighlightClass(id: string): string {
    const hl = useContext(HighlightContext);
    if (!hl.active) return '';
    return hl.colorById[id] ? `hl-c${hl.colorById[id]}` : 'hl-dimmed';
}

/**
 * CSS class for an edge: same logic as nodes (`hl-c${n}` when tagged, else
 * 'hl-dimmed'; '' when mode is off).
 */
export function useEdgeHighlightClass(id: string): string {
    const hl = useContext(HighlightContext);
    if (!hl.active) return '';
    return hl.colorById[id] ? `hl-c${hl.colorById[id]}` : 'hl-dimmed';
}
