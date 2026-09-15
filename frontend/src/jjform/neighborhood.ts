/**
 * jjform/neighborhood — il VICINATO di un'istanza, come dato e come posizione
 * (slice 13a, `13a Diagramma Embedded.dc.html`, opzione 1a).
 *
 * ── Che cosa NON e' ───────────────────────────────────────────────────────────
 *
 * Non e' un canvas. Il canvas vero esiste (v2-flow) ed e' a un click — «Open in
 * canvas» e' il suo punto d'innesto. Qui non ci sono gesti spaziali: nessun drag,
 * nessun edge-draw, nessuna create, nessun layout persistito. Il riquadro e' una
 * VISTA DERIVATA dallo store: lettura piu' navigazione, e la form accanto resta la
 * superficie di scrittura.
 *
 * Non e' nemmeno un motore di layout. Le posizioni qui sono aritmetica su tre
 * colonne e una riga — owner sopra, soggetto al centro, entranti a sinistra,
 * uscenti a destra — che e' la regola dichiarata nel prompt di 13a. Il mock 1a
 * dispone entrambi i lati a destra; la deviazione e' consapevole e sta in
 * `docs/discovery/discovery_2026-08-31_vicinato_manager_13a.md` §9 Q3.
 *
 * ── L'invariante della directory, di nuovo ────────────────────────────────────
 *
 * ZERO import. Come `shape.ts`, `nav.ts` e `outline.ts`: un import da `joiner/`
 * si tirerebbe dietro monaco e `window`, e la portabilita' finirebbe.
 *
 * ── Un salto, e il perche' ────────────────────────────────────────────────────
 *
 * Owner a UN livello, refs a UN salto, entranti a UN salto. Non e' una
 * semplificazione: il riquadro risponde a «chi tocca questa istanza», e la
 * risposta a due salti e' un grafo che nessuno legge in 360px. La profondita' e'
 * dell'outline (10b), che il containment lo mostra tutto.
 */

/** Che parte del vicinato occupa un nodo. `subject` e' l'istanza selezionata:
 *  ce n'e' esattamente uno, sempre. */
export type NeighborRole = 'subject' | 'owner' | 'incoming' | 'outgoing';

/** `broken` e' un puntatore che non risolve: reso, mai saltato — la stessa scelta
 *  dell'outline e lo stesso token della tabella (`instance-manager__broken`). Un
 *  riferimento appeso che sparisce in silenzio racconta un modello sano che non
 *  c'e'. */
export type NeighborKind = 'object' | 'broken';

/** Il valore saliente di un nodo: UNO, gia' deciso dalla ladder
 *  (`detectValueRenderer`), mai una seconda decisione. `missing` e' il required
 *  rimasto senza valore — il token della tabella, non un trattino. */
export interface NeighborValue {
    key: string;
    text: string;
    missing: boolean;
}

export interface NeighborNode {
    /** Id del DObject; per un nodo `broken`, il puntatore morto stesso — non c'e'
     *  altro con cui identificarlo. */
    id: string;
    name: string;
    /** Nome della metaclasse. Vuoto per un nodo `broken`. */
    cls: string;
    kind: NeighborKind;
    role: NeighborRole;
    /** Al piu' uno. Assente quando l'istanza non ha attributi con valore. */
    value?: NeighborValue;
}

export interface NeighborEdge {
    /** Id del nodo sorgente. */
    source: string;
    target: string;
    /** La chiave della feature che regge il puntatore: e' l'etichetta dell'arco,
     *  ed e' l'unica cosa che distingue due archi fra la stessa coppia. Per
     *  l'arco di owner e' la feature di contenimento; null solo quando non e'
     *  risolvibile. */
    featureKey: string | null;
    kind: 'owner' | 'reference';
}

/** Il vicinato come dato. Serializzabile: la resa e' del chiamante, come per ogni
 *  altro modulo qui. */
export interface Neighborhood {
    subjectId: string;
    nodes: NeighborNode[];
    edges: NeighborEdge[];
}

// ── Le misure del disegno ───────────────────────────────────────────────────
// Costanti nominate perche' compaiono in due posti che non devono divergere: il
// calcolo delle posizioni qui e il foglio di stile che dimensiona la scatola.

export const NEIGHBOR_NODE_W = 112;
export const NEIGHBOR_NODE_H = 46;
/** Distanza orizzontale fra due colonne. */
export const NEIGHBOR_COL_GAP = 40;
/** Distanza verticale fra due nodi della stessa colonna laterale. */
export const NEIGHBOR_ROW_GAP = 18;
/** Distanza verticale fra l'owner e il soggetto. */
export const NEIGHBOR_OWNER_GAP = 40;

export interface PlacedNode extends NeighborNode {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface PlacedEdge extends NeighborEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    /** Sorgente e bersaglio coincidono (auto-riferimento): il chiamante disegna un
     *  cappio invece di un segmento di lunghezza zero. */
    selfLoop: boolean;
}

export interface NeighborhoodLayout {
    width: number;
    height: number;
    nodes: PlacedNode[];
    edges: PlacedEdge[];
}

/** Il centro del bordo da cui un arco parte, dato il verso della coppia.
 *  Orizzontale quando le due scatole sono su colonne diverse, verticale quando
 *  sono incolonnate — che e' il caso del solo arco di owner. */
function endpoints(a: PlacedNode, b: PlacedNode): { x1: number; y1: number; x2: number; y2: number } {
    const acx = a.x + a.w / 2;
    const bcx = b.x + b.w / 2;
    const acy = a.y + a.h / 2;
    const bcy = b.y + b.h / 2;
    if (a.x + a.w <= b.x) return { x1: a.x + a.w, y1: acy, x2: b.x, y2: bcy };
    if (b.x + b.w <= a.x) return { x1: a.x, y1: acy, x2: b.x + b.w, y2: bcy };
    if (a.y + a.h <= b.y) return { x1: acx, y1: a.y + a.h, x2: bcx, y2: b.y };
    if (b.y + b.h <= a.y) return { x1: acx, y1: a.y, x2: bcx, y2: b.y + b.h };
    return { x1: acx, y1: acy, x2: bcx, y2: bcy };
}

/**
 * Le posizioni, derivate — non un layout engine.
 *
 * Tre colonne al piu': entranti, soggetto, uscenti. Una colonna VUOTA non occupa
 * spazio: un'istanza senza entranti non deve pagare 150px di vuoto a sinistra in
 * un pannello di 360. L'owner sta nella colonna del soggetto, sopra.
 *
 * Le colonne laterali sono centrate sul soggetto, e se una sborda in alto tutto
 * il disegno scende: nessun nodo con y negativa, mai, perche' il chiamante
 * dimensiona la scatola su `height` e cio' che sta sopra lo zero non si vedrebbe.
 */
export function neighborhoodLayout(n: Neighborhood | null | undefined): NeighborhoodLayout {
    const empty: NeighborhoodLayout = { width: 0, height: 0, nodes: [], edges: [] };
    if (!n || n.nodes.length === 0) return empty;

    const subject = n.nodes.find(x => x.role === 'subject');
    if (!subject) return empty;
    const owner = n.nodes.find(x => x.role === 'owner') ?? null;
    const incoming = n.nodes.filter(x => x.role === 'incoming');
    const outgoing = n.nodes.filter(x => x.role === 'outgoing');

    const colStep = NEIGHBOR_NODE_W + NEIGHBOR_COL_GAP;
    const subjectX = incoming.length > 0 ? colStep : 0;
    const outgoingX = subjectX + colStep;
    const cols = (incoming.length > 0 ? 1 : 0) + 1 + (outgoing.length > 0 ? 1 : 0);
    const width = cols * NEIGHBOR_NODE_W + (cols - 1) * NEIGHBOR_COL_GAP;

    const ownerY = 0;
    const subjectY = owner ? NEIGHBOR_NODE_H + NEIGHBOR_OWNER_GAP : 0;
    const subjectCenter = subjectY + NEIGHBOR_NODE_H / 2;

    const rowStep = NEIGHBOR_NODE_H + NEIGHBOR_ROW_GAP;
    const columnTop = (count: number): number => {
        const total = count * NEIGHBOR_NODE_H + (count - 1) * NEIGHBOR_ROW_GAP;
        return subjectCenter - total / 2;
    };
    const inTop = incoming.length > 0 ? columnTop(incoming.length) : 0;
    const outTop = outgoing.length > 0 ? columnTop(outgoing.length) : 0;
    const shift = Math.max(0, -inTop, -outTop);

    const placed: PlacedNode[] = [];
    const box = (node: NeighborNode, x: number, y: number): PlacedNode =>
        ({ ...node, x, y: y + shift, w: NEIGHBOR_NODE_W, h: NEIGHBOR_NODE_H });

    if (owner) placed.push(box(owner, subjectX, ownerY));
    placed.push(box(subject, subjectX, subjectY));
    incoming.forEach((node, i) => placed.push(box(node, 0, inTop + i * rowStep)));
    outgoing.forEach((node, i) => placed.push(box(node, outgoingX, outTop + i * rowStep)));

    const byId = new Map<string, PlacedNode>();
    for (const p of placed) byId.set(p.id, p);

    const edges: PlacedEdge[] = [];
    for (const e of n.edges) {
        const a = byId.get(e.source);
        const b = byId.get(e.target);
        if (!a || !b) continue;                       // un arco senza capi non si disegna
        if (a.id === b.id) {
            edges.push({ ...e, selfLoop: true, x1: a.x + a.w, y1: a.y + a.h / 2, x2: a.x + a.w, y2: a.y + a.h / 2 });
            continue;
        }
        edges.push({ ...e, selfLoop: false, ...endpoints(a, b) });
    }

    const height = placed.reduce((max, p) => Math.max(max, p.y + p.h), 0);
    return { width, height, nodes: placed, edges };
}

/**
 * Che cosa legge un nodo.
 *
 * Un'istanza senza nome NON si stampa vuota — la stessa ragione di
 * `outlineLabel`: una riga senza testo e' una riga che non si clicca con
 * fiducia, e la tabella accanto scrive gia' `unnamed` nello stesso stato.
 */
export function neighborLabel(node: NeighborNode | null | undefined): string {
    if (!node) return '';
    if (node.kind === 'broken') return 'dangling pointer';
    const name = (node.name ?? '').trim();
    return name.length > 0 ? name : 'unnamed';
}

/**
 * La frase quando il vicinato e' il solo soggetto.
 *
 * Un riquadro vuoto e' indistinguibile da un riquadro rotto: se un'istanza e'
 * radice del modello e non punta e non e' puntata, il pannello lo DICE. Con un
 * owner, o con un arco solo, non c'e' niente da spiegare e la funzione tace.
 */
export function neighborhoodNote(n: Neighborhood | null | undefined): string | null {
    if (!n) return null;
    if (n.nodes.length > 1 || n.edges.length > 0) return null;
    return 'No owner and no references: this instance stands alone in the model.';
}
