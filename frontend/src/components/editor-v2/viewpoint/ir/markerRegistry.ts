/**
 * markerRegistry — i marker interni delle notazioni, come tabella dati.
 *
 * Un marker e' un simbolo dipinto dentro il contorno del nodo: la x del gateway
 * esclusivo BPMN, l'orologio dell'evento timer, la H dello stato storia UML.
 * E' uno StyleModifier (invariante I3): non tocca il contorno, quindi non tocca
 * ancore, hit-testing e atterraggio degli archi.
 *
 * Vocabolario APERTO, come le icone dei badge (`BadgeSpec.icon`): l'IR persiste
 * l'id come stringa e un id fuori tabella non disegna nulla, senza errori.
 * Aggiungere un marker e' aggiungere una entry qui (D10: un dato in piu', non
 * codice del motore). I 16 marker iniziali coprono i simboli dell'inventario
 * 2026-08-14 (90 simboli / 14 notazioni) che si distinguono per marker.
 *
 * Convenzioni di disegno:
 * - viewBox `0 0 100 100`, glifo centrato in (50,50) dentro il box 26..74;
 * - il layer di resa usa `preserveAspectRatio="xMidYMid meet"`, quindi il glifo
 *   scala con min(width, height) del nodo e resta centrato (come nei renderer
 *   BPMN il marker cresce con la forma);
 * - path stroke-only (fill none) salvo `fill: true` (il pallino dello stato
 *   finale / token di Petri); lo stroke width e' in unita' di viewBox, quindi
 *   scala col glifo;
 * - il colore lo decide il layer di resa: quello del bordo della forma.
 *
 * Modulo puro: nessun React, nessun Redux, nessun import a runtime da editor-v2.
 */

/** Un tratto del glifo: path SVG nel viewBox 0..100. */
export interface MarkerPath {
    /** Path `d` in coordinate del viewBox, glifo centrato in (50,50). */
    readonly d: string;
    /** true = campito col colore del marker; assente/false = solo stroke. */
    readonly fill?: boolean;
}

export interface MarkerDef {
    readonly id: string;
    /** Etichetta per il pannello di authoring. */
    readonly label: string;
    readonly paths: readonly MarkerPath[];
}

/** viewBox del layer marker (IRNodeContent). */
export const MARKER_VIEWBOX = '0 0 100 100';

/** Stroke dei glifi, in unita' di viewBox: scala con min(w,h) del nodo
 *  (~2.8px su un lato corto di 40px). */
export const MARKER_STROKE_WIDTH = 7;

export const MARKER_REGISTRY: Readonly<Record<string, MarkerDef>> = {
    // Gateway BPMN (dentro il rombo)
    x: { id: 'x', label: 'X (exclusive)', paths: [{ d: 'M32,32 L68,68 M68,32 L32,68' }] },
    plus: { id: 'plus', label: 'Plus (parallel)', paths: [{ d: 'M50,26 L50,74 M26,50 L74,50' }] },
    circle: { id: 'circle', label: 'Circle (inclusive)', paths: [{ d: 'M26,50 A24,24 0 1,0 74,50 A24,24 0 1,0 26,50' }] },
    asterisk: { id: 'asterisk', label: 'Asterisk (complex)', paths: [{ d: 'M50,26 L50,74 M29,38 L71,62 M71,38 L29,62' }] },
    // Eventi BPMN (dentro il cerchio)
    envelope: { id: 'envelope', label: 'Envelope (message)', paths: [{ d: 'M28,34 L72,34 L72,66 L28,66 Z M28,34 L50,52 L72,34' }] },
    clock: {
        id: 'clock', label: 'Clock (timer)',
        paths: [{ d: 'M26,50 A24,24 0 1,0 74,50 A24,24 0 1,0 26,50' }, { d: 'M50,50 L50,34 M50,50 L61,57' }],
    },
    triangle: { id: 'triangle', label: 'Triangle (signal)', paths: [{ d: 'M50,28 L72,68 L28,68 Z' }] },
    lightning: { id: 'lightning', label: 'Lightning (error)', paths: [{ d: 'M56,26 L38,52 L48,52 L42,74 L62,46 L52,46 Z' }] },
    // Task BPMN (nell'angolo del rounded, in v1 centrati come gli altri)
    gear: {
        id: 'gear', label: 'Gear (service)',
        paths: [
            { d: 'M38,50 A12,12 0 1,0 62,50 A12,12 0 1,0 38,50' },
            { d: 'M50,26 L50,34 M50,66 L50,74 M26,50 L34,50 M66,50 L74,50 M33,33 L38.6,38.6 M61.4,61.4 L67,67 M67,33 L61.4,38.6 M38.6,61.4 L33,67' },
        ],
    },
    person: {
        id: 'person', label: 'Person (user)',
        paths: [{ d: 'M42,38 A8,8 0 1,0 58,38 A8,8 0 1,0 42,38' }, { d: 'M30,70 A20,16 0 0,1 70,70' }],
    },
    document: { id: 'document', label: 'Document (script)', paths: [{ d: 'M32,30 L68,30 L68,64 Q59,58 50,64 Q41,70 32,64 Z' }] },
    loop: {
        id: 'loop', label: 'Loop',
        paths: [{ d: 'M50,74 A24,24 0 1,1 74,50' }, { d: 'M74,50 L66,46 M74,50 L70,58' }],
    },
    bars: { id: 'bars', label: 'Bars (multi-instance)', paths: [{ d: 'M42,34 L42,66 M50,34 L50,66 M58,34 L58,66' }] },
    // Statechart UML (dentro il cerchio)
    dot: { id: 'dot', label: 'Dot (final state, token)', paths: [{ d: 'M34,50 A16,16 0 1,0 66,50 A16,16 0 1,0 34,50', fill: true }] },
    history: { id: 'history', label: 'H (history)', paths: [{ d: 'M38,32 L38,68 M62,32 L62,68 M38,50 L62,50' }] },
    'history-deep': {
        id: 'history-deep', label: 'H* (deep history)',
        paths: [{ d: 'M30,32 L30,68 M50,32 L50,68 M30,50 L50,50' }, { d: 'M66,40 L66,60 M57,45 L75,55 M75,45 L57,55' }],
    },
};

/** Definizione del marker; id assente, vuoto o fuori tabella => undefined (nessun marker). */
export function getMarkerDef(id: string | undefined): MarkerDef | undefined {
    return id ? MARKER_REGISTRY[id] : undefined;
}
