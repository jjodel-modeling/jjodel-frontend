// Affordance di resize per tipo di nodo in editor-v2.
// Specchio TEMPORANEO dei flag adaptWidth/adaptHeight dichiarati per view in
// redux/defaults/views.ts: quei flag NON sono cablati fino a editor-v2 (niente
// plumbing R6, decisione D4). Quando il sizing passera' nell'IR, QUESTA mappa e'
// il punto unico da sostituire.
export interface NodeSizing { adaptWidth: boolean; adaptHeight: boolean; }

export const NODE_SIZING_DEFAULTS: Record<string, NodeSizing> = {
    objectNode: { adaptWidth: true, adaptHeight: true },
    classNode:  { adaptWidth: true, adaptHeight: true },
    enumNode:   { adaptWidth: true, adaptHeight: true },
    // packageNode: intenzionalmente assente (container libero, fuori scope).
};

// Floor del resize per i nodi shape (view IR con shape geometrica).
export const SHAPE_MIN_SIZE = 24;

// Un nodo e' ridimensionabile a mano solo se: (a) ha una shape geometrica
// (emendamento 2026-07-24: la geometria vince sul content-hug), oppure
// (b) almeno un asse NON e' content-adaptive.
// Tipo non mappato (es. packageNode) => comportamento invariato: resizer montato.
export function isNodeResizable(type: string | undefined, hasGeometricShape = false): boolean {
    if (hasGeometricShape) return true;
    const s = type ? NODE_SIZING_DEFAULTS[type] : undefined;
    if (!s) return true;
    return !s.adaptWidth || !s.adaptHeight;
}
