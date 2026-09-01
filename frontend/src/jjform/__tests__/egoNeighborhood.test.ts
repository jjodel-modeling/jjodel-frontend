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
 *
 * FL7 aggiunge l'OWNER, e la fixture non e' cambiata di una riga per accoglierlo:
 * il contenimento `Heater.states` era gia' li' dentro dal primo giorno, scartato
 * dal filtro. E' il fatto che ha reso la slice possibile senza toccare l'host —
 * il prompt lo chiamava `Region_main`, che e' il nome della board 13a e non esiste
 * nel codice; qui l'owner di `Running` e' `Heater`, via `states`.
 */

import { describe, expect, it, vi } from 'vitest';
import {
    EGO_COL_GAP,
    EGO_MAX_PER_SIDE,
    EGO_NODE_H,
    EGO_NODE_W,
    EGO_OWNER_GAP,
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

// ── L'owner (FL7) ───────────────────────────────────────────────────────────

describe('egoNeighborhood — l owner', () => {
    it('l owner e la macchina che contiene lo stato, con la sua chiave', () => {
        const ego = egoNeighborhood(heater());
        expect(ego.owner).toMatchObject({
            id: HEATER.id,
            name: 'Heater',
            cls: 'StateMachine',
            kind: 'object',
            side: 'owner',
            featureKeys: ['states'],
        });
    });

    it('il footer NON cambia: l owner non e un entrante e non e un referrer', () => {
        // La riga della tabella dice 3 e il nastro deve continuare a dire 3. Se
        // l'owner entrasse in uno dei tre numeri, due letture a due centimetri di
        // distanza si contraddirebbero.
        const ego = egoNeighborhood(heater());
        expect(ego.counts).toEqual({ incoming: 1, outgoing: 2, referencedBy: 3 });
        expect(egoSummary(ego.counts)).toBe('1 incoming · 2 outgoing · referenced by 3');
        expect(ids(ego.incoming)).not.toContain(HEATER.id);
        expect(ids(ego.outgoing)).not.toContain(HEATER.id);
    });

    it('istanza rootable: nessun puntatore di contenimento -> owner null', () => {
        // Il `father` di un'istanza radice e' il MODELLO, che non e' un DObject:
        // `referencedBy` non produce mai una voce per lui. Il null non e' un caso
        // gestito, e' il silenzio della sorgente.
        const rootable = heater();
        rootable.incoming = rootable.incoming.filter(r => !r.composition);
        expect(egoNeighborhood(rootable).owner).toBeNull();

        expect(egoNeighborhood({ subject: RUNNING, outgoing: [], incoming: [] }).owner).toBeNull();
        expect(egoNeighborhood(null).owner).toBeNull();
    });

    it('l owner che e anche vicino resta UN nodo, nel ruolo di vicino', () => {
        // `Heater` contiene `Running` E lo punta con `current`. Una scatola sola,
        // nella colonna entrante, e `ego.owner` e' quella stessa scatola: e' cosi'
        // che il tipo dice «disegnato una volta sola».
        const input = heater();
        input.incoming = [...input.incoming, incoming(HEATER, 'current')];
        const ego = egoNeighborhood(input);

        expect(names(ego.incoming)).toEqual(['start', 'Heater']);
        expect(ego.owner).not.toBeNull();
        expect(ego.owner).toBe(ego.incoming[1]);          // identita', non copia
        expect(ego.owner!.side).toBe('incoming');
        // Entrambe le chiavi sullo stesso nodo: il riferimento e il contenimento.
        expect(ego.owner!.featureKeys).toEqual(['current', 'states']);
        // E il conteggio segue il riferimento, non il contenimento: 4 puntatori
        // entranti, quello di `states` ancora non contato.
        expect(ego.counts).toEqual({ incoming: 2, outgoing: 2, referencedBy: 4 });
    });

    it('un owner che e anche il quinto uscente riprende la sua banda', () => {
        // «Una volta sola» vuol dire una volta DISEGNATA. Tagliato fuori dal cap,
        // quel nodo non e' in nessuna colonna: se tenesse il `side` della colonna
        // l'owner sparirebbe dietro il «+n more».
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: Array.from({ length: 5 }, (_, i) => ({
                featureKey: 'outgoing',
                targetId: i === 4 ? HEATER.id : 't' + i,
                target: i === 4 ? HEATER : inst('t' + i, 'T' + i, 'Transition'),
            })),
            incoming: [incoming(HEATER, 'states', true)],
        });

        expect(ids(ego.outgoing)).not.toContain(HEATER.id);   // il cap l'ha tagliato
        expect(ego.owner).toMatchObject({ id: HEATER.id, side: 'owner' });
        expect(ego.owner!.featureKeys).toEqual(['outgoing', 'states']);
    });

    it('un auto-contenimento non e un owner', () => {
        const ego = egoNeighborhood({
            subject: RUNNING,
            outgoing: [],
            incoming: [incoming(RUNNING, 'substates', true)],
        });
        expect(ego.owner).toBeNull();
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

    it('l owner seleziona il suo id, per la stessa strada dei vicini', () => {
        const h = handlers();
        const ego = egoNeighborhood(heater());

        expect(egoAction(ego.owner, ego.subject.id)).toEqual({ kind: 'select', id: HEATER.id });
        expect(egoDispatch(ego.owner, h, ego.subject.id)).toEqual({ kind: 'select', id: HEATER.id });
        expect(h.onSelect).toHaveBeenCalledTimes(1);
        expect(h.onSelect).toHaveBeenCalledWith(HEATER.id);
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

    it('l owner sta in una banda sopra, e le colonne scendono di altrettanto', () => {
        const l = egoLayout(egoNeighborhood(heater()));
        // 10k punto 7: la banda e' `EGO_OWNER_GAP`, non `EGO_ROW_GAP`. Fra owner
        // e soggetto passa `ownerLink`; fra due scatole della stessa colonna no.
        const band = EGO_NODE_H + EGO_OWNER_GAP;

        expect(l.owner).toMatchObject({ id: HEATER.id, y: 0, w: EGO_NODE_W, h: EGO_NODE_H });
        // Sopra A SINISTRA: un `EGO_COL_GAP` a sinistra del soggetto, che e' la
        // sola unita' orizzontale di questo disegno.
        expect(l.owner!.x).toBe(l.subject.x - EGO_COL_GAP);
        expect(l.subject.y).toBeGreaterThanOrEqual(band);
        for (const n of [...l.incoming, ...l.outgoing]) expect(n.y).toBeGreaterThanOrEqual(band);
        expect(l.height).toBe(band + Math.max(EGO_SUBJECT_H, 2 * EGO_NODE_H + EGO_ROW_GAP));
        // La gronda vera, quella che l'arco attraversa.
        expect(l.subject.y - (l.owner!.y + l.owner!.h)).toBeGreaterThanOrEqual(EGO_OWNER_GAP);
    });

    it('il legame dell owner e una retta, e non e fra le frecce', () => {
        const l = egoLayout(egoNeighborhood(heater()));
        // `L`, non `C`: le cubiche sono dei riferimenti. E fuori da `arrows`,
        // perche' e' l'unica linea che il renderer disegna senza punta.
        expect(l.ownerLink).toBe(
            `M ${l.owner!.x + EGO_NODE_W / 2} ${EGO_NODE_H}`
            + ` L ${l.subject.x + EGO_SUBJECT_W / 2} ${l.subject.y}`,
        );
        expect(l.arrows).toHaveLength(l.incoming.length + l.outgoing.length);
        expect(l.arrows.some(a => a.nodeId === HEATER.id)).toBe(false);
    });

    it('senza colonna entrante l owner resta sopra, contro il bordo', () => {
        // `subjectX` e' zero e la sottrazione andrebbe sotto zero: si taglia a
        // zero invece di spingere fuori dal disegno. Sopra e a sinistra finche'
        // c'e' un a sinistra.
        const l = egoLayout(egoNeighborhood({
            subject: RUNNING,
            outgoing: [],
            incoming: [incoming(HEATER, 'states', true)],
        }));
        expect(l.subject.x).toBe(0);
        expect(l.owner!.x).toBe(0);
        expect(l.width).toBe(EGO_SUBJECT_W);
        expect(l.height).toBe(EGO_NODE_H + EGO_OWNER_GAP + EGO_SUBJECT_H);
        // Il caso minimo e' anche il caso peggiore: senza vicini `bodyH` resta
        // `EGO_SUBJECT_H`, il soggetto non scende da se', e la gronda e' tutta
        // e sola la banda. E' lo schermo del referto utente.
        expect(l.subject.y - EGO_NODE_H).toBe(EGO_OWNER_GAP);
    });

    it('nessun owner, nessuna banda: le misure di FL5 alla cifra', () => {
        const noOwner = heater();
        noOwner.incoming = noOwner.incoming.filter(r => !r.composition);
        const l = egoLayout(egoNeighborhood(noOwner));

        expect(l.owner).toBeNull();
        expect(l.ownerLink).toBeNull();
        // Nessuno scarto in testa: la colonna piu' alta parte da zero, e l'altezza
        // e' la sua, non la sua piu' una banda.
        expect(l.outgoing[0].y).toBe(0);
        expect(l.height).toBe(2 * EGO_NODE_H + EGO_ROW_GAP);
    });

    it('un owner gia disegnato come vicino non costa una banda', () => {
        const input = heater();
        input.incoming = [...input.incoming, incoming(HEATER, 'current')];
        const l = egoLayout(egoNeighborhood(input));

        expect(l.owner).toBeNull();
        expect(l.ownerLink).toBeNull();
        expect(l.incoming[0].y).toBe(0);
        expect(l.height).toBe(2 * EGO_NODE_H + EGO_ROW_GAP);
        // La scatola c'e', ma e' nella colonna entrante: una sola, non due.
        expect(l.incoming.filter(n => n.id === HEATER.id)).toHaveLength(1);
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
