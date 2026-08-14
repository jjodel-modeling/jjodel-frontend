// Affordance di resize per tipo di nodo in editor-v2.
// Specchio TEMPORANEO dei flag adaptWidth/adaptHeight dichiarati per view in
// redux/defaults/views.ts: quei flag NON sono cablati fino a editor-v2 (niente
// plumbing R6, decisione D4). Quando il sizing passera' nell'IR, QUESTA mappa e'
// il punto unico da sostituire.
import type { ShapeForm } from '../viewpoint/ir/irTypes';
import { getShapeDescriptor } from '../viewpoint/ir/shapeRegistry';

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

// Forme geometriche ridimensionabili di default (unico punto di verita', usato da
// ObjectNode e dal VertexAuthoringPanel per evitare drift). rect/rounded NON lo
// sono: diventano resizable solo col flag esplicito `resizable` sulla VertexViewIR.
// Il dato vive ora nel descriptor della forma (viewpoint/ir/shapeRegistry.ts);
// questa resta la porta d'ingresso per il lato nodes/.
export function defaultResizableForForm(form: ShapeForm | undefined): boolean {
    return getShapeDescriptor(form).defaultResizable;
}

// Il resize mantiene il rapporto d'aspetto (oggi: solo circle). Stessa fonte di
// verita' del gate sopra, cosi' ObjectNode non ricabla il caso a mano.
export function keepAspectRatioForForm(form: ShapeForm | undefined): boolean {
    return getShapeDescriptor(form).keepAspectRatio;
}
