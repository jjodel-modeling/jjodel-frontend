/**
 * Test di `jjform/neighborhood` — le posizioni derivate e le due frasi (13a).
 *
 * Puro su dati piatti, come gli altri test di questa directory: il modulo non
 * importa niente, quindi il test non ha nemmeno un `idlookup` finto da costruire.
 *
 * Cio' che va tenuto e' che il layout non e' un'estetica: e' un CONTRATTO fra il
 * dato e la scatola che lo contiene. Le tre cose che il riquadro non puo'
 * permettersi — una colonna vuota che occupa spazio in un pannello da 360px, un
 * nodo con y negativa che finirebbe fuori dalla scatola, un arco disegnato verso
 * un nodo che non c'e' — sono qui, una per `it`.
 */

import { describe, expect, it } from 'vitest';
import {
    NEIGHBOR_COL_GAP,
    NEIGHBOR_NODE_H,
    NEIGHBOR_NODE_W,
    neighborLabel,
    neighborhoodLayout,
    neighborhoodNote,
} from '../neighborhood';
import type { Neighborhood, NeighborNode } from '../neighborhood';

const node = (id: string, role: NeighborNode['role'], over: Partial<NeighborNode> = {}): NeighborNode => ({
    id, name: id, cls: 'State', kind: 'object', role, ...over,
});

/** Soggetto solo, owner sopra, due entranti e un uscente. */
function full(): Neighborhood {
    return {
        subjectId: 's',
        nodes: [
            node('s', 'subject'),
            node('own', 'owner', { cls: 'Region' }),
            node('in1', 'incoming'),
            node('in2', 'incoming'),
            node('out1', 'outgoing'),
        ],
        edges: [
            { source: 'own', target: 's', featureKey: 'states', kind: 'owner' },
            { source: 'in1', target: 's', featureKey: 't1', kind: 'reference' },
            { source: 'in2', target: 's', featureKey: 't2', kind: 'reference' },
            { source: 's', target: 'out1', featureKey: 'next', kind: 'reference' },
        ],
    };
}

const at = (l: ReturnType<typeof neighborhoodLayout>, id: string) => l.nodes.find(n => n.id === id)!;

describe('neighborhoodLayout — le tre colonne', () => {
    it('entranti a sinistra, soggetto al centro, uscenti a destra', () => {
        const l = neighborhoodLayout(full());
        expect(at(l, 'in1').x).toBe(0);
        expect(at(l, 's').x).toBe(NEIGHBOR_NODE_W + NEIGHBOR_COL_GAP);
        expect(at(l, 'out1').x).toBe(2 * (NEIGHBOR_NODE_W + NEIGHBOR_COL_GAP));
        // L'owner e' incolonnato col soggetto, e sopra.
        expect(at(l, 'own').x).toBe(at(l, 's').x);
        expect(at(l, 'own').y).toBeLessThan(at(l, 's').y);
    });

    it('una colonna vuota non occupa spazio: senza entranti il soggetto e a sinistra', () => {
        const n = full();
        n.nodes = n.nodes.filter(x => x.role !== 'incoming');
        n.edges = n.edges.filter(e => e.source.startsWith('in') === false);
        const l = neighborhoodLayout(n);
        expect(at(l, 's').x).toBe(0);
        expect(at(l, 'out1').x).toBe(NEIGHBOR_NODE_W + NEIGHBOR_COL_GAP);
        expect(l.width).toBe(2 * NEIGHBOR_NODE_W + NEIGHBOR_COL_GAP);
    });

    it('senza owner il soggetto parte da zero; con owner scende', () => {
        const solo: Neighborhood = { subjectId: 's', nodes: [node('s', 'subject')], edges: [] };
        expect(at(neighborhoodLayout(solo), 's').y).toBe(0);
        expect(at(neighborhoodLayout(full()), 's').y).toBeGreaterThan(0);
    });

    it('nessun nodo sopra lo zero: una colonna alta fa scendere tutto il disegno', () => {
        const n = full();
        // Sei entranti contro un soggetto alto 46: centrata, la colonna sborderebbe
        // in alto. Il disegno scende invece di tagliare.
        n.nodes = [node('s', 'subject'), ...Array.from({ length: 6 }, (_, i) => node('in' + i, 'incoming'))];
        n.edges = n.nodes.filter(x => x.role === 'incoming')
            .map(x => ({ source: x.id, target: 's', featureKey: 'r', kind: 'reference' as const }));
        const l = neighborhoodLayout(n);
        expect(Math.min(...l.nodes.map(p => p.y))).toBe(0);
        expect(at(l, 's').y).toBeGreaterThan(0);
        // E l'altezza dichiarata contiene tutto: e' cio' su cui l'host dimensiona.
        expect(l.height).toBe(Math.max(...l.nodes.map(p => p.y + p.h)));
    });

    it('le colonne laterali sono centrate sul soggetto', () => {
        const l = neighborhoodLayout(full());
        const s = at(l, 's');
        const centre = (a: string, b: string) => (at(l, a).y + at(l, b).y + NEIGHBOR_NODE_H) / 2;
        expect(centre('in1', 'in2')).toBeCloseTo(s.y + NEIGHBOR_NODE_H / 2, 5);
    });
});

describe('neighborhoodLayout — gli archi', () => {
    it('un arco fra colonne parte dal fianco e arriva al fianco', () => {
        const l = neighborhoodLayout(full());
        const e = l.edges.find(x => x.source === 'in1')!;
        expect(e.x1).toBe(at(l, 'in1').x + NEIGHBOR_NODE_W);   // fianco destro dell'entrante
        expect(e.x2).toBe(at(l, 's').x);                        // fianco sinistro del soggetto
        expect(e.selfLoop).toBe(false);
    });

    it("l'arco di owner e verticale: sotto l'owner, sopra il soggetto", () => {
        const l = neighborhoodLayout(full());
        const e = l.edges.find(x => x.kind === 'owner')!;
        expect(e.y1).toBe(at(l, 'own').y + NEIGHBOR_NODE_H);
        expect(e.y2).toBe(at(l, 's').y);
        expect(e.featureKey).toBe('states');
    });

    it('un auto-riferimento e dichiarato, non disegnato come segmento nullo', () => {
        const n: Neighborhood = {
            subjectId: 's',
            nodes: [node('s', 'subject')],
            edges: [{ source: 's', target: 's', featureKey: 'next', kind: 'reference' }],
        };
        const l = neighborhoodLayout(n);
        expect(l.edges).toHaveLength(1);
        expect(l.edges[0].selfLoop).toBe(true);
    });

    it('un arco senza capi non si disegna', () => {
        const n: Neighborhood = {
            subjectId: 's',
            nodes: [node('s', 'subject')],
            edges: [{ source: 's', target: 'fantasma', featureKey: 'next', kind: 'reference' }],
        };
        expect(neighborhoodLayout(n).edges).toHaveLength(0);
    });

    it('vicinato assente o senza soggetto: layout vuoto, non un errore', () => {
        expect(neighborhoodLayout(null).nodes).toEqual([]);
        expect(neighborhoodLayout({ subjectId: 's', nodes: [], edges: [] }).width).toBe(0);
        expect(neighborhoodLayout({ subjectId: 's', nodes: [node('x', 'owner')], edges: [] }).nodes).toEqual([]);
    });
});

describe('neighborLabel e neighborhoodNote — mai un vuoto muto', () => {
    it('un nodo senza nome legge unnamed, un puntatore morto dice che lo e', () => {
        expect(neighborLabel(node('s', 'subject', { name: '   ' }))).toBe('unnamed');
        expect(neighborLabel(node('ghost', 'outgoing', { kind: 'broken', name: '' }))).toBe('dangling pointer');
        expect(neighborLabel(null)).toBe('');
    });

    it('soggetto solo: la frase; con un owner o un arco: silenzio', () => {
        const alone: Neighborhood = { subjectId: 's', nodes: [node('s', 'subject')], edges: [] };
        expect(neighborhoodNote(alone)).toMatch(/stands alone/);
        expect(neighborhoodNote(full())).toBeNull();
    });
});
