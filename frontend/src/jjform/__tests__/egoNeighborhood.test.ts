/**
 * Test di `jjform/egoNeighborhood` — il nastro a un salto della riga espandibile
 * (FL5).
 *
 * La fixture e' `Heater`, la stessa macchina a stati del campione 1b
 * (`sample-StateMachine.xmi`): stati `Idle`, `Running`, `Off`, `Broken`, e le
 * transizioni `start` (Idle→Running), `stop` (Running→Off) e una terza mai
 * rinominata, che la regola del nome stampa come `Transition_0` (Running→Broken).
 * Soggetto: `Running`.
 *
 * Cio' che i numeri della fixture provano, e che nessun'altra asserzione qui
 * prova, e' la PRECEDENZA fra i due lati. `Running` e' bersaglio di tre puntatori
 * — `start.target`, `stop.source`, `Transition_0.source` — ma due di quelle
 * transizioni sono gia' i suoi uscenti. Un modulo senza precedenza disegnerebbe
 * `stop` due volte, una per lato, e direbbe «3 incoming» sotto un disegno con due
 * scatole di troppo. Qui la colonna entrante resta con il solo `start`, il footer
 * dichiara `referenced by 3`, e i due numeri portano nomi diversi perche' contano
 * cose diverse.
 */

import { describe, expect, it, vi } from 'vitest';
import {
    EGO_COL_GAP,
    EGO_MAX_PER_SIDE,
    EGO_NODE_H,
    EGO_NODE_W,
    EGO_ROW_GAP,
    EGO_SUBJECT_H,
    EGO_SUBJECT_W,
    egoAction,
    egoDispatch,
    egoLabel,
    egoLayout,
    egoNeighborhood,
    egoShowAll,
    egoSummary,
} from '../egoNeighborhood';
import type { EgoInput, EgoInstance, EgoNode } from '../egoNeighborhood';
import type { IncomingRef } from '../shape';

// ── La fixture ──────────────────────────────────────────────────────────────

const inst = (id: string, name: string, cls: string): EgoInstance => ({ id, name, cls });

const RUNNING = inst('o_running', 'Running', 'State');
const T_UNNAMED = inst('o_t2', 'Transition_0', 'Transition');
const T_STOP = inst('o_t1', 'stop', 'Transition');
const T_START = inst('o_t0', 'start', 'Transition');
const HEATER = inst('o_heater', 'Heater', 'StateMachine');

/** Un puntatore entrante come `ShapeCtx.referencedBy` lo consegna. */
const incoming = (
    from: EgoInstance,
    featureKey: string,
    composition = false,
    index = 0,
): IncomingRef => ({
    instanceId: from.id,
    instanceName: from.name,
    instanceClass: from.cls,
    featureKey,
    featureId: 'f_' + featureKey,
    composition,
    index,
});

/** `Running` come lo vede il manager: due transizioni uscenti dallo slot
 *  `outgoing`, tre puntatori entranti piu' il contenimento della macchina. */
function heater(): EgoInput {
    return {
        subject: RUNNING,
        outgoing: [
            { featureKey: 'outgoing', targetId: T_UNNAMED.id, target: T_UNNAMED },
            { featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP },
        ],
        incoming: [
            incoming(HEATER, 'states', true),        // il contenimento: non e' un referrer
            incoming(T_START, 'target'),
            incoming(T_STOP, 'source'),
            incoming(T_UNNAMED, 'source'),
        ],
    };
}

const names = (nodes: EgoNode[]) => nodes.map(n => n.name);
const ids = (nodes: EgoNode[]) => nodes.map(n => n.id);

// ── Il modulo puro ──────────────────────────────────────────────────────────

describe('egoNeighborhood — la fixture Heater/Running', () => {
    it('un entrante (start), due uscenti (Transition_0, stop), referenced by 3', () => {
        const ego = egoNeighborhood(heater());

        expect(names(ego.incoming)).toEqual(['start']);
        expect(names(ego.outgoing)).toEqual(['Transition_0', 'stop']);
        expect(ego.counts).toEqual({ incoming: 1, outgoing: 2, referencedBy: 3 });
    });

    it('il soggetto e il soggetto, e non compare fra i vicini', () => {
        const ego = egoNeighborhood(heater());
        expect(ego.subject).toMatchObject({ id: RUNNING.id, name: 'Running', cls: 'State' });
        expect(ids([...ego.incoming, ...ego.outgoing])).not.toContain(RUNNING.id);
    });

    it('un uscente che punta indietro resta UN nodo, con entrambe le chiavi', () => {
        const ego = egoNeighborhood(heater());
        const stop = ego.outgoing.find(n => n.name === 'stop')!;
        // `stop` e' uscente per `outgoing` ed entrante per `source`: una scatola,
        // due etichette. Due scatole racconterebbero due transizioni.
        expect(stop.featureKeys).toEqual(['outgoing', 'source']);
        expect(ids(ego.incoming)).not.toContain(T_STOP.id);
    });

    it('il contenimento non e un referrer: la macchina non entra ne fra i nodi ne nel conteggio', () => {
        const ego = egoNeighborhood(heater());
        expect(ids(ego.incoming)).not.toContain(HEATER.id);
        // Quattro puntatori entranti in ingresso, tre contati: il quarto e' `states`.
        expect(ego.counts.referencedBy).toBe(3);
    });

    it('il footer nomina i tre numeri, e li nomina in ordine', () => {
        expect(egoSummary(egoNeighborhood(heater()).counts))
            .toBe('1 incoming · 2 outgoing · referenced by 3');
    });
});

describe('egoNeighborhood — il cap per lato', () => {
    /** Sei uscenti, tutti distinti. */
    function six(): EgoInput {
        return {
            subject: RUNNING,
            outgoing: Array.from({ length: 6 }, (_, i) => ({
                featureKey: 'outgoing',
                targetId: 't' + i,
                target: inst('t' + i, 'T' + i, 'Transition'),
            })),
            incoming: [],
        };
    }

    it('sei uscenti -> quattro nodi piu il sintetico «+2 more»', () => {
        const ego = egoNeighborhood(six());

        expect(ego.outgoing).toHaveLength(EGO_MAX_PER_SIDE + 1);
        expect(names(ego.outgoing.slice(0, EGO_MAX_PER_SIDE))).toEqual(['T0', 'T1', 'T2', 'T3']);

        const more = ego.outgoing[EGO_MAX_PER_SIDE];
        expect(more.kind).toBe('more');
        expect(more.more).toBe(2);
        expect(egoLabel(more)).toBe('+2 more');
    });

    it('il conteggio resta quello VERO: il footer dice 6, il disegno ne mostra 4', () => {
        // Il cap e' del disegno, non del dato. Un footer che dicesse 4 mentirebbe
        // esattamente dove il lettore va a controllare se ne mancano.
        expect(egoNeighborhood(six()).counts.outgoing).toBe(6);
    });

    it('esattamente quattro non produce nessun sintetico', () => {
        const four = six();
        four.outgoing = four.outgoing.slice(0, EGO_MAX_PER_SIDE);
        const ego = egoNeighborhood(four);
        expect(ego.outgoing).toHaveLength(EGO_MAX_PER_SIDE);
        expect(ego.outgoing.some(n => n.kind === 'more')).toBe(false);
    });

    it('il cap vale anche a sinistra', () => {
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: [],
            incoming: Array.from({ length: 7 }, (_, i) =>
                incoming(inst('s' + i, 'S' + i, 'Transition'), 'target')),
        });
        expect(ego.incoming).toHaveLength(EGO_MAX_PER_SIDE + 1);
        expect(ego.incoming[EGO_MAX_PER_SIDE].more).toBe(3);
        expect(ego.counts.incoming).toBe(7);
    });
});

describe('egoNeighborhood — i vuoti e gli stati storti', () => {
    it('istanza isolata: nessun nodo per lato, tutti i conteggi a zero', () => {
        const ego = egoNeighborhood({ subject: RUNNING, outgoing: [], incoming: [] });
        expect(ego.incoming).toEqual([]);
        expect(ego.outgoing).toEqual([]);
        expect(ego.counts).toEqual({ incoming: 0, outgoing: 0, referencedBy: 0 });
        // La clausola finale cade a zero: e' la frase che il prompt chiede per
        // l'istanza isolata, e non ripete con un numero il vuoto del disegno.
        expect(egoSummary(ego.counts)).toBe('0 incoming · 0 outgoing');
    });

    it('senza ingresso il modulo non esplode: un soggetto vuoto e tre zeri', () => {
        const ego = egoNeighborhood(null);
        expect(ego.subject.id).toBe('');
        expect(ego.counts).toEqual({ incoming: 0, outgoing: 0, referencedBy: 0 });
    });

    it('un puntatore che non risolve e un nodo `broken`, non un nodo saltato', () => {
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: [{ featureKey: 'outgoing', targetId: 'ghost', target: null }],
            incoming: [],
        });
        expect(ego.outgoing).toHaveLength(1);
        expect(ego.outgoing[0]).toMatchObject({ id: 'ghost', kind: 'broken' });
        expect(egoLabel(ego.outgoing[0])).toBe('dangling pointer');
    });

    it('un auto-riferimento non diventa un vicino: la chiave finisce sul soggetto', () => {
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: [{ featureKey: 'substates', targetId: RUNNING.id, target: RUNNING }],
            incoming: [incoming(RUNNING, 'substates')],
        });
        expect(ego.outgoing).toEqual([]);
        expect(ego.incoming).toEqual([]);
        expect(ego.subject.featureKeys).toEqual(['substates']);
    });

    it('due posizioni dello stesso slot verso lo stesso bersaglio sono UN nodo', () => {
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: [
                { featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP },
                { featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP },
            ],
            incoming: [],
        });
        expect(ego.outgoing).toHaveLength(1);
        expect(ego.outgoing[0].featureKeys).toEqual(['outgoing']);
        expect(ego.counts.outgoing).toBe(1);
    });

    it('un vicino senza nome si legge `unnamed`, mai vuoto', () => {
        expect(egoLabel({ id: 'x', name: '  ', cls: 'State', kind: 'object', side: 'incoming', featureKeys: [] }))
            .toBe('unnamed');
    });
});

// ── Il click ────────────────────────────────────────────────────────────────

describe('egoDispatch — l unica interazione', () => {
    const handlers = () => ({ onSelect: vi.fn(), onOpenInCanvas: vi.fn() });

    it('un vicino seleziona quell istanza, con il suo id', () => {
        const h = handlers();
        const ego = egoNeighborhood(heater());
        const start = ego.incoming[0];

        expect(egoDispatch(start, h, ego.subject.id)).toEqual({ kind: 'select', id: T_START.id });
        expect(h.onSelect).toHaveBeenCalledTimes(1);
        expect(h.onSelect).toHaveBeenCalledWith(T_START.id);
        expect(h.onOpenInCanvas).not.toHaveBeenCalled();
    });

    it('«+n more» apre il canvas, e NON seleziona', () => {
        const h = handlers();
        const more: EgoNode = {
            id: 'outgoing:+2', name: '+2 more', cls: '', kind: 'more', side: 'outgoing', featureKeys: [], more: 2,
        };
        expect(egoDispatch(more, h)).toEqual({ kind: 'canvas' });
        expect(h.onOpenInCanvas).toHaveBeenCalledTimes(1);
        expect(h.onSelect).not.toHaveBeenCalled();
    });

    it('«show all» apre il canvas, e NON seleziona', () => {
        const h = handlers();
        expect(egoShowAll(h)).toEqual({ kind: 'canvas' });
        expect(h.onOpenInCanvas).toHaveBeenCalledTimes(1);
        expect(h.onSelect).not.toHaveBeenCalled();
    });

    it('il soggetto e un `broken` non fanno niente', () => {
        const h = handlers();
        const ego = egoNeighborhood(heater());
        const broken: EgoNode = { id: 'ghost', name: '', cls: '', kind: 'broken', side: 'outgoing', featureKeys: [] };

        expect(egoDispatch(ego.subject, h, ego.subject.id)).toEqual({ kind: 'none' });
        expect(egoDispatch(broken, h)).toEqual({ kind: 'none' });
        expect(egoAction(null)).toEqual({ kind: 'none' });
        expect(h.onSelect).not.toHaveBeenCalled();
        expect(h.onOpenInCanvas).not.toHaveBeenCalled();
    });
});

// ── Le posizioni ────────────────────────────────────────────────────────────

describe('egoLayout — tre colonne, fisse', () => {
    it('entranti a sinistra, soggetto al centro, uscenti a destra', () => {
        const l = egoLayout(egoNeighborhood(heater()));
        expect(l.incoming[0].x).toBe(0);
        expect(l.subject.x).toBe(EGO_NODE_W + EGO_COL_GAP);
        expect(l.outgoing[0].x).toBe(EGO_NODE_W + EGO_COL_GAP + EGO_SUBJECT_W + EGO_COL_GAP);
        expect(l.width).toBe(l.outgoing[0].x + EGO_NODE_W);
    });

    it('zero entranti: la colonna non esiste e il nastro comincia dal soggetto', () => {
        const l = egoLayout(egoNeighborhood({
            subject: RUNNING,
            outgoing: [{ featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP }],
            incoming: [],
        }));
        expect(l.incoming).toEqual([]);
        expect(l.subject.x).toBe(0);
        expect(l.width).toBe(EGO_SUBJECT_W + EGO_COL_GAP + EGO_NODE_W);
        // «freccia assente», non freccia verso il nulla.
        expect(l.arrows.every(a => a.side === 'outgoing')).toBe(true);
    });

    it('istanza isolata: solo il soggetto, nessuna freccia, larghezza del soggetto', () => {
        const l = egoLayout(egoNeighborhood({ subject: RUNNING, outgoing: [], incoming: [] }));
        expect(l.arrows).toEqual([]);
        expect(l.width).toBe(EGO_SUBJECT_W);
        expect(l.height).toBe(EGO_SUBJECT_H);
        expect(l.subject).toMatchObject({ x: 0, y: 0 });
    });

    it('nessuna scatola sopra lo zero, e le colonne restano dentro l altezza', () => {
        // Cinque per lato (quattro piu' il sintetico) e' la colonna piu' alta che
        // il cap consente: se sbordasse, il chiamante che dimensiona la scatola su
        // `height` taglierebbe la prima e l'ultima.
        const l = egoLayout(egoNeighborhood({
            subject: RUNNING,
            outgoing: [],
            incoming: Array.from({ length: 6 }, (_, i) =>
                incoming(inst('s' + i, 'S' + i, 'Transition'), 'target')),
        }));
        expect(l.incoming).toHaveLength(EGO_MAX_PER_SIDE + 1);
        for (const n of [...l.incoming, l.subject]) {
            expect(n.y).toBeGreaterThanOrEqual(0);
            expect(n.y + n.h).toBeLessThanOrEqual(l.height);
        }
        expect(l.height).toBe(5 * EGO_NODE_H + 4 * EGO_ROW_GAP);
    });

    it('una freccia per vicino, e va dal bordo del vicino al bordo del soggetto', () => {
        const l = egoLayout(egoNeighborhood(heater()));
        expect(l.arrows).toHaveLength(l.incoming.length + l.outgoing.length);

        const inArrow = l.arrows.find(a => a.side === 'incoming')!;
        const from = l.incoming[0];
        expect(inArrow.d.startsWith(`M ${from.x + from.w} ${from.y + from.h / 2} C `)).toBe(true);
        expect(inArrow.d.endsWith(`${l.subject.x} ${l.subject.y + l.subject.h / 2}`)).toBe(true);

        const outArrow = l.arrows.find(a => a.side === 'outgoing')!;
        expect(outArrow.d.startsWith(`M ${l.subject.x + l.subject.w} ${l.subject.y + l.subject.h / 2} C `))
            .toBe(true);
    });

    it('con un vicino solo per lato la curva e piatta: stessa quota ai due capi', () => {
        const l = egoLayout(egoNeighborhood({
            subject: RUNNING,
            outgoing: [{ featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP }],
            incoming: [],
        }));
        const y = l.subject.y + l.subject.h / 2;
        expect(l.outgoing[0].y + l.outgoing[0].h / 2).toBe(y);
        expect(l.arrows[0].d).toBe(
            `M ${l.subject.x + l.subject.w} ${y} C ${l.subject.x + l.subject.w + EGO_COL_GAP / 2} ${y}, `
            + `${l.outgoing[0].x - EGO_COL_GAP / 2} ${y}, ${l.outgoing[0].x} ${y}`,
        );
    });
});
