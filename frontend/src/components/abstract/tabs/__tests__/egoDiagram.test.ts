/**
 * Test di `EgoDiagram` — il nastro come MARKUP, e come dipendenze (FL5).
 *
 * Tre cose che il test puro del modulo non raggiunge:
 *
 *  1. LE DIPENDENZE. «Il componente non importa nulla dal canvas» e' una
 *     proprieta' del file, non del suo output, quindi si asserisce sul sorgente.
 *     Non e' igiene: e' cio' che rende il resto di questo file possibile. Il
 *     barrel di `editor-v2/` arriva a monaco, che dereferenzia `window`
 *     all'import, e la suite gira con `environment: 'node'` — un solo import di
 *     troppo e il file muore prima del primo `it`.
 *
 *  2. I VUOTI. «Zero incoming -> colonna assente E freccia assente, non colonna
 *     vuota» e' un'affermazione sui pixel, quindi si controlla sui pixel — cioe'
 *     sul markup che li produce.
 *
 *  3. L'INSTRADAMENTO, per quel tanto che node concede. `vitest.config.ts`
 *     dichiara `environment: 'node'` e non c'e' jsdom ne' testing-library in
 *     `package.json`: un click non e' simulabile. Le tre invocazioni
 *     (`onSelect` col suo id, «+n more» e «show all» verso il canvas) sono
 *     verificate DAVVERO nel test puro, su `egoDispatch` e `egoShowAll`; qui si
 *     asserisce che il componente passi di li' e non instradi a mano, che e' la
 *     meta' dell'affermazione che vive in questo file.
 *
 * Come in `widgets/__tests__/extendedWidgets.test.ts`: `renderToStaticMarkup`
 * gira in node, `react-dom` e' gia' una dipendenza, e `createElement` diretto
 * evita il JSX cosi' il file resta un `.ts` e viene raccolto dal glob.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import EgoDiagram from '../EgoDiagram';
import { EGO_MAX_PER_SIDE, egoNeighborhood } from '../../../../jjform/egoNeighborhood';
import type { EgoInput, EgoInstance } from '../../../../jjform/egoNeighborhood';
import type { IncomingRef } from '../../../../jjform/shape';

const SOURCE = readFileSync(resolve(__dirname, '../EgoDiagram.tsx'), 'utf8');

const inst = (id: string, name: string, cls: string): EgoInstance => ({ id, name, cls });

const RUNNING = inst('o_running', 'Running', 'State');
const T_STOP = inst('o_t1', 'stop', 'Transition');
const T_START = inst('o_t0', 'start', 'Transition');
const HEATER = inst('o_heater', 'Heater', 'StateMachine');

const incoming = (from: EgoInstance, featureKey: string, composition = false): IncomingRef => ({
    instanceId: from.id,
    instanceName: from.name,
    instanceClass: from.cls,
    featureKey,
    featureId: 'f_' + featureKey,
    composition,
    index: 0,
});

function render(input: EgoInput): string {
    return renderToStaticMarkup(createElement(EgoDiagram, {
        ego: egoNeighborhood(input),
        onSelect: () => { /* the pure test drives the routing */ },
        onOpenInCanvas: () => { /* idem */ },
    }));
}

/** Il vicinato di `Running`: un entrante, un uscente. */
const both: EgoInput = {
    subject: RUNNING,
    outgoing: [{ featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP }],
    incoming: [incoming(T_START, 'target')],
};

const countOf = (html: string, needle: string) => html.split(needle).length - 1;

// ── 1. Le dipendenze ────────────────────────────────────────────────────────

describe('le dipendenze del componente', () => {
    /** Ogni specificatore di modulo importato dal file. */
    const specifiers = [...SOURCE.matchAll(/^import[^;]*?from\s+'([^']+)'|^import\s+'([^']+)'/gm)]
        .map(m => m[1] ?? m[2]);

    it('il positivo di controllo: la regex vede davvero gli import del file', () => {
        // Senza questo, una regex rotta produrrebbe una lista vuota e ogni
        // asserzione di assenza qui sotto passerebbe senza aver guardato niente.
        expect(specifiers).toContain('react');
        expect(specifiers).toContain('../../../jjform/egoNeighborhood');
        expect(specifiers.length).toBeGreaterThanOrEqual(3);
    });

    it('niente dal canvas, dallo store o dal joiner', () => {
        for (const s of specifiers) {
            expect(s, `import proibito: ${s}`).not.toMatch(/editor-v2|joiner|redux|react-redux/);
        }
    });

    it('la sola sorgente di regole e `jjform`', () => {
        const local = specifiers.filter(s => s.startsWith('.') && !s.endsWith('.scss'));
        expect(local).toEqual(['../../../jjform/egoNeighborhood']);
    });
});

// ── 2. Il markup ────────────────────────────────────────────────────────────

describe('le tre colonne', () => {
    it('rende un entrante, un uscente e il soggetto al centro', () => {
        const html = render(both);
        expect(html).toContain('>start<');
        expect(html).toContain('>stop<');
        expect(html).toContain('Running : State');
        expect(html).toContain('this object');
        expect(countOf(html, 'ego-diagram__node"')).toBe(2);
    });

    it('il soggetto non e cliccabile, i vicini si', () => {
        const html = render(both);
        // Due scatole con `role="button"`: i due vicini. Il soggetto non ce l'ha.
        expect(countOf(html, 'role="button"')).toBe(2);
        expect(html).toMatch(/ego-diagram__subject"[^>]*>(?![^]*role="button")/);
    });

    it('l intestazione dichiara il salto e le due affordance', () => {
        const html = render(both);
        expect(html).toContain('Neighborhood · 1 hop');
        expect(html).toContain('click a node to select it');
        expect(html).toContain('open in canvas');
    });

    it('il footer nomina i tre conteggi e offre «show all»', () => {
        const html = render(both);
        expect(html).toContain('1 incoming · 1 outgoing · referenced by 1');
        expect(html).toContain('show all');
    });
});

describe('i vuoti', () => {
    it('zero incoming: nessuna scatola a sinistra e NESSUNA freccia entrante', () => {
        const html = render({
            subject: RUNNING,
            outgoing: [{ featureKey: 'outgoing', targetId: T_STOP.id, target: T_STOP }],
            incoming: [],
        });
        // Una scatola vicina sola, e una freccia sola: la colonna assente non
        // lascia dietro di se' ne' un vuoto ne' un arco verso il nulla.
        expect(countOf(html, 'ego-diagram__node"')).toBe(1);
        expect(countOf(html, 'ego-diagram__arrow"')).toBe(1);
        expect(html).not.toContain('>start<');
    });

    it('oggetto isolato: solo il soggetto, nessuna freccia, footer a due numeri', () => {
        const html = render({ subject: RUNNING, outgoing: [], incoming: [] });
        expect(countOf(html, 'ego-diagram__node"')).toBe(0);
        expect(countOf(html, 'ego-diagram__arrow"')).toBe(0);
        expect(html).toContain('this object');
        expect(html).toContain('0 incoming · 0 outgoing<');
        // Niente «show all»: non c'e' nessun resto da mostrare.
        expect(html).not.toContain('show all');
    });

    it('un puntatore rotto si rende, e non si clicca', () => {
        const html = render({
            subject: RUNNING,
            outgoing: [{ featureKey: 'outgoing', targetId: 'ghost', target: null }],
            incoming: [],
        });
        expect(html).toContain('dangling pointer');
        expect(html).toContain('ego-diagram__node--broken');
        expect(countOf(html, 'role="button"')).toBe(0);
    });
});

// ── L'owner (FL7) ───────────────────────────────────────────────────────────

describe('l owner', () => {
    /** `Running`, piu' la macchina che lo contiene. */
    const owned: EgoInput = {
        ...both,
        incoming: [incoming(HEATER, 'states', true), incoming(T_START, 'target')],
    };

    it('la scatola dell owner porta la sottoetichetta, non la metaclasse', () => {
        const html = render(owned);
        expect(html).toContain('>Heater<');
        expect(html).toContain('ego-diagram__node-owner');
        expect(html).toContain('>owner<');
        // La metaclasse dell'owner non e' nella scatola — tre righe in 40px non
        // ci stanno — ma e' nel tooltip, che e' dove il resto del nastro la porta
        // per esteso.
        expect(html).toContain('Owner: Heater : StateMachine — via states');
    });

    it('il legame di containment e reso, e SENZA punta', () => {
        const html = render(owned);
        // Un `<path>` in piu' delle due frecce, e l'unico senza `markerEnd`:
        // la punta e' cio' che distingue un riferimento da un contenimento.
        expect(countOf(html, 'ego-diagram__owner-link')).toBe(1);
        expect(countOf(html, 'ego-diagram__arrow"')).toBe(2);
        expect(html).toMatch(/ego-diagram__owner-link"[^>]*d="M [\d.]+ [\d.]+ L [\d.]+ [\d.]+"/);
        expect(html).not.toMatch(/ego-diagram__owner-link"[^>]*marker/);
    });

    it('l owner e cliccabile come ogni altro nodo', () => {
        const html = render(owned);
        // Tre `role="button"`: i due vicini piu' l'owner. Il soggetto non ce l'ha.
        expect(countOf(html, 'role="button"')).toBe(3);
        expect(countOf(html, 'ego-diagram__node"')).toBe(3);
    });

    it('nessun contenimento: nessuna scatola e nessuna linea', () => {
        // `both` e' lo stesso vicinato senza la voce di contenimento: il positivo
        // di controllo dell'asserzione qui sopra e' il test precedente, che sulla
        // stessa resa trova entrambi.
        const html = render(both);
        expect(html).not.toContain('ego-diagram__node-owner');
        expect(html).not.toContain('ego-diagram__owner-link');
        expect(countOf(html, 'ego-diagram__node"')).toBe(2);
    });

    it('un owner che e anche vicino si rende UNA volta, e senza linea', () => {
        const html = render({
            ...both,
            incoming: [
                incoming(HEATER, 'states', true),
                incoming(HEATER, 'current'),
                incoming(T_START, 'target'),
            ],
        });
        expect(countOf(html, '>Heater<')).toBe(1);
        expect(html).not.toContain('ego-diagram__node-owner');
        expect(html).not.toContain('ego-diagram__owner-link');
        // Nella colonna entrante porta la metaclasse come ogni vicino, e il
        // tooltip tiene entrambe le chiavi.
        expect(html).toContain('Heater : StateMachine — via current, states');
    });
});

describe('il cap', () => {
    it('sei uscenti: quattro scatole vere piu «+2 more»', () => {
        const html = render({
            subject: RUNNING,
            outgoing: Array.from({ length: 6 }, (_, i) => ({
                featureKey: 'outgoing',
                targetId: 't' + i,
                target: inst('t' + i, 'T' + i, 'Transition'),
            })),
            incoming: [],
        });
        expect(html).toContain('+2 more');
        expect(html).toContain('ego-diagram__node--more');
        // Quattro scatole VERE piu' una sintetica. Il conteggio delle vere si
        // prende su `ego-diagram__node"`, che si chiude sulla virgoletta: il
        // sintetico porta la stessa classe seguita da uno spazio e dal
        // modificatore, quindi non ci cade dentro.
        expect(countOf(html, 'ego-diagram__node"')).toBe(EGO_MAX_PER_SIDE);
        expect(countOf(html, 'ego-diagram__node--more')).toBe(1);
        // Il footer dice il numero VERO, non quello disegnato.
        expect(html).toContain('0 incoming · 6 outgoing');
    });
});

// ── 3. L'instradamento ──────────────────────────────────────────────────────

describe('il click passa dal modulo, non dal componente', () => {
    it('i vicini vanno per `egoDispatch`, «show all» per `egoShowAll`', () => {
        expect(SOURCE).toMatch(/egoDispatch\(node, handlers, ego\.subject\.id\)/);
        expect(SOURCE).toMatch(/onClick=\{\(\) => egoShowAll\(handlers\)\}/);
    });

    it('`onSelect` non e mai invocato a mano: la sola chiamata e dentro `egoDispatch`', () => {
        // Il componente lo riceve come prop e lo inoltra in `handlers`; un
        // `onSelect(...)` scritto qui sarebbe un secondo instradamento, non
        // verificabile e libero di divergere da `egoAction`.
        expect(SOURCE).not.toMatch(/\bonSelect\(/);
    });

    it('«open in canvas» dell intestazione e il gesto diretto', () => {
        expect(SOURCE).toMatch(/onClick=\{onOpenInCanvas\}/);
    });
});
