import { describe, it, expect } from 'vitest';
import { buildVertexResolver } from '../vertexResolver';

/**
 * `buildVertexResolver` e' una funzione pura su una forma `idlookup`: bastano oggetti
 * duck-typed (stessa convenzione di `conformanceToProblems.test.ts` — nessun barrel,
 * ambiente `node`).
 *
 * ── QUESTI TEST SONO LA PROVA DEL COMMIT 1 ──────────────────────────────────
 *
 * Il commit estrae il risolutore da `ConformanceProblemSync` e non cambia il
 * comportamento. La prova richiesta e' che la conformance risolva gli stessi id di
 * prima, quindi i casi qui sotto sono descritti DALL'INGRESSO che quel produttore
 * costruisce — `store.getState().idlookup` piu' il `graphId` del grafo aperto — e non
 * da un contratto inventato per il modulo nuovo.
 *
 * Le espressioni attese sono scritte a mano e non derivate da una copia della vecchia
 * implementazione: un mirror per copia proverebbe che due copie concordano, non che il
 * comportamento e' quello giusto (R-C).
 */

type AnyObj = Record<string, any>;

/** Un grafo con i suoi vertici, nella forma che `idlookup` ha davvero. */
function lookupWith(graphId: string, vertices: AnyObj[], extra: AnyObj = {}): AnyObj {
    const out: AnyObj = {
        [graphId]: { id: graphId, className: 'DGraph', subElements: vertices.map(v => v.id) },
        ...extra,
    };
    for (const v of vertices) out[v.id] = v;
    return out;
}

const vertex = (id: string, model: string): AnyObj =>
    ({ id, className: 'DVertex', model });

describe('buildVertexResolver', () => {
    it('traduce l\'id del DObject in quello del DVertex che lo porta', () => {
        const lookup = lookupWith('g1', [vertex('v1', 'o1'), vertex('v2', 'o2')]);
        const resolve = buildVertexResolver(lookup, 'g1');
        expect(resolve('o1')).toBe('v1');
        expect(resolve('o2')).toBe('v2');
    });

    it('restituisce null per un oggetto che nel grafo non ha vertice', () => {
        const lookup = lookupWith('g1', [vertex('v1', 'o1')]);
        expect(buildVertexResolver(lookup, 'g1')('o_altrove')).toBeNull();
    });

    it('ignora i subElements che non sono DVertex', () => {
        // Un DGraph contiene anche edge e altro: solo i DVertex portano un `model`.
        const lookup = lookupWith('g1', [
            vertex('v1', 'o1'),
            { id: 'e1', className: 'DVoidEdge', model: 'o1' },
        ]);
        const resolve = buildVertexResolver(lookup, 'g1');
        expect(resolve('o1')).toBe('v1');
    });

    it('ignora un DVertex senza `model`', () => {
        const lookup = lookupWith('g1', [
            { id: 'v0', className: 'DVertex' },
            vertex('v1', 'o1'),
        ]);
        expect(buildVertexResolver(lookup, 'g1')('o1')).toBe('v1');
    });

    // Il risolutore e' per UN grafo: lo stesso oggetto puo' avere un vertice in piu'
    // grafi, e quello che interessa e' il vertice del grafo aperto. Un risolutore
    // costruito sul progetto intero sceglierebbe a caso.
    it('e\' limitato al grafo passato: un vertice di un altro grafo non risolve', () => {
        const lookup = {
            ...lookupWith('g1', [vertex('v1', 'o1')]),
            ...lookupWith('g2', [vertex('v9', 'o9')]),
        };
        const resolve = buildVertexResolver(lookup, 'g1');
        expect(resolve('o1')).toBe('v1');
        expect(resolve('o9')).toBeNull();
    });

    // Tre silenzi che devono restare silenzi e non diventare eccezioni: il produttore
    // gira anche prima che il grafo esista.
    it('restituisce sempre null senza graphId', () => {
        const lookup = lookupWith('g1', [vertex('v1', 'o1')]);
        expect(buildVertexResolver(lookup, null)('o1')).toBeNull();
        expect(buildVertexResolver(lookup, undefined)('o1')).toBeNull();
        expect(buildVertexResolver(lookup, '')('o1')).toBeNull();
    });

    it('restituisce sempre null senza idlookup', () => {
        expect(buildVertexResolver(undefined, 'g1')('o1')).toBeNull();
    });

    it('restituisce sempre null se il grafo non e\' in idlookup', () => {
        expect(buildVertexResolver({}, 'g_inesistente')('o1')).toBeNull();
    });

    it('sopporta un grafo senza subElements', () => {
        const lookup = { g1: { id: 'g1', className: 'DGraph' } };
        expect(buildVertexResolver(lookup, 'g1')('o1')).toBeNull();
    });

    // Comportamento della vecchia implementazione, conservato di proposito: `map.set`
    // sovrascrive, quindi con due vertici dello stesso oggetto nello stesso grafo vince
    // l'ULTIMO nell'ordine dei subElements. Non e' una scelta nuova, e' quella che c'era.
    it('con due vertici dello stesso oggetto nello stesso grafo vince l\'ultimo', () => {
        const lookup = lookupWith('g1', [vertex('vA', 'o1'), vertex('vB', 'o1')]);
        expect(buildVertexResolver(lookup, 'g1')('o1')).toBe('vB');
    });
});
