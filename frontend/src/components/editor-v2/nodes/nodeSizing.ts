// Affordance di resize per tipo di nodo in editor-v2.
// Specchio TEMPORANEO dei flag adaptWidth/adaptHeight dichiarati per view in
// redux/defaults/views.ts: quei flag NON sono cablati fino a editor-v2 (niente
// plumbing R6, decisione D4). Quando il sizing passera' nell'IR, QUESTA mappa e'
// il punto unico da sostituire.
import type { ShapeForm } from '../viewpoint/ir/irTypes';
import { getShapeDescriptor, type Size } from '../viewpoint/ir/shapeRegistry';

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

// Taglia di default della view (`VertexViewIR.defaultSize`, P-2026-09-29-1230). Un asse
// e' usabile solo se e' un numero finito > 0: la stessa funzione fa da regola di
// authoring (irValidate) e da lettura permissiva del render, cosi' i due non possono
// dissentire su cosa sia "usabile" (stesso criterio di authoredCornerRadius).
export interface DefaultSizeAxes { width?: number; height?: number; }

export function usableSizeAxis(v: unknown): number | undefined {
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
}

// Gli assi usabili di `defaultSize`, o undefined se non ce n'e' nessuno (chiave
// assente, oggetto vuoto, valori invalidi persistiti): allora la view non ha default.
export function authoredDefaultSize(v: unknown): DefaultSizeAxes | undefined {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
    const width = usableSizeAxis((v as DefaultSizeAxes).width);
    const height = usableSizeAxis((v as DefaultSizeAxes).height);
    if (width === undefined && height === undefined) return undefined;
    return { ...(width !== undefined ? { width } : {}), ...(height !== undefined ? { height } : {}) };
}

// Box di un vertex disegnato alla taglia di default. Ogni asse autorato ha il pavimento
// del resize a mano (SHAPE_MIN_SIZE), non quello della derivazione (minBox*, che
// .mm-node.ir-sized neutralizza per qualunque taglia esplicita); l'asse assente resta
// quello derivato. Forma a rapporto fisso (circle): lato = il maggiore degli assi
// autorati, come fa il NodeResizer con keepAspectRatio.
export function defaultBoxFor(defaults: DefaultSizeAxes, derived: Size, keepAspect: boolean): Size {
    const w = defaults.width !== undefined ? Math.max(SHAPE_MIN_SIZE, defaults.width) : undefined;
    const h = defaults.height !== undefined ? Math.max(SHAPE_MIN_SIZE, defaults.height) : undefined;
    if (keepAspect) {
        const s = Math.max(w ?? 0, h ?? 0);
        return { w: s, h: s };
    }
    return { w: w ?? derived.w, h: h ?? derived.h };
}

// Chi possiede la taglia di un vertex IR, in ordine di precedenza: la taglia manuale del
// layout in vigore (slice 1c), poi il default della view, poi la derivazione dal
// contenuto (solo forme con supplemento). null = content-hug CSS, nessuno la scrive.
export type SizeSource = 'manual' | 'default' | 'derived';

export function sizeSourceOf(
    isResized: boolean, hasSupplement: boolean, defaults: DefaultSizeAxes | undefined,
): SizeSource | null {
    if (isResized) return 'manual';
    if (defaults) return 'default';
    return hasSupplement ? 'derived' : null;
}
