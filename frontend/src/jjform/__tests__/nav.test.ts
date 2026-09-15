import { describe, it, expect } from 'vitest';
import {
    INLINE_DEPTH_LIMIT,
    breadcrumbOf,
    crumbLabel,
    currentOf,
    depthOf,
    drillInto,
    drillOut,
    navFor,
    rendersInline,
    rootOf,
    truncateTo,
    type NavStep,
} from '../nav';

/**
 * Il contratto di `jjform/nav` (slice 12c) — la regola di profondita' e il
 * breadcrumb, come li specifica `Instance Node Proposal.dc.html`, Turno 12,
 * pannello `12c`: «Inline stops at 1 level; beyond, drill-in replaces the form
 * body», e «il breadcrumb tiene la strada del containment. Ogni segmento e'
 * cliccabile».
 *
 * La catena del design e' `Sensor -> Port -> Filter`, ed e' quella usata qui.
 */

const step = (id: string, name: string, cls: string, childKey: string | null = null): NavStep =>
    ({ id, name, cls, childKey });

const S = step('s1', 's1', 'Sensor');
const P = step('p2', 'p2', 'Port', 'ports');
const F = step('f1', 'f1', 'Filter', 'filters');

describe('la regola di profondita\'', () => {
    it('un livello inline, dichiarato una volta sola', () => {
        expect(INLINE_DEPTH_LIMIT).toBe(1);
    });

    it('il soggetto della form rende i figli inline', () => {
        expect(rendersInline(0)).toBe(true);
    });

    it('dal secondo livello in poi si passa al drill-in', () => {
        expect(rendersInline(1)).toBe(false);
        expect(rendersInline(2)).toBe(false);
    });
});

describe('la navigazione', () => {
    it('una form si apre alla radice, a profondita\' zero', () => {
        const n = navFor(S);
        expect(depthOf(n)).toBe(0);
        expect(rootOf(n)).toEqual(S);
        expect(currentOf(n)).toEqual(S);
    });

    it('il drill-in sostituisce il corpo, non apre una seconda form', () => {
        // Una sola form: il path cresce, non lo stack.
        const n = drillInto(drillInto(navFor(S), P), F);
        expect(n.path).toHaveLength(3);
        expect(rootOf(n)).toEqual(S);          // la radice non cambia mai
        expect(currentOf(n)).toEqual(F);       // il corpo e' quello del figlio
        expect(depthOf(n)).toBe(2);            // livello 3 del design
    });

    it('risalire di un livello', () => {
        const n = drillOut(drillInto(drillInto(navFor(S), P), F));
        expect(currentOf(n)).toEqual(P);
    });

    it('alla radice, risalire non svuota il path', () => {
        // Una form ha sempre un soggetto.
        const n = drillOut(navFor(S));
        expect(n.path).toHaveLength(1);
        expect(currentOf(n)).toEqual(S);
    });

    it('rientrare su un\'istanza gia\' sul path tronca invece di allungare', () => {
        // Un ciclo di containment il core lo rifiuta; un breadcrumb costruito su un
        // modello corrotto crescerebbe comunque senza fine.
        const deep = drillInto(drillInto(navFor(S), P), F);
        const back = drillInto(deep, P);
        expect(back.path.map(s => s.id)).toEqual(['s1', 'p2']);
        expect(currentOf(back)).toEqual(P);
    });
});

describe('il breadcrumb', () => {
    it('tiene la strada del containment, con la profondita\' di ogni segmento', () => {
        const crumbs = breadcrumbOf(drillInto(drillInto(navFor(S), P), F));
        expect(crumbs.map(c => c.id)).toEqual(['s1', 'p2', 'f1']);
        expect(crumbs.map(c => c.depth)).toEqual([0, 1, 2]);
    });

    it('l\'ultimo segmento e\' quello corrente, e non e\' un link', () => {
        const crumbs = breadcrumbOf(drillInto(navFor(S), P));
        expect(crumbs.map(c => c.isCurrent)).toEqual([false, true]);
    });

    it('ogni segmento ricorda lo slot da cui e\' passato', () => {
        // Due slot sullo stesso metaclasse non sarebbero altrimenti distinguibili.
        const crumbs = breadcrumbOf(drillInto(drillInto(navFor(S), P), F));
        expect(crumbs.map(c => c.childKey)).toEqual([null, 'ports', 'filters']);
    });

    it('un click su un segmento tronca: dalla profondita\' 2 alla 0 in un colpo', () => {
        const deep = drillInto(drillInto(navFor(S), P), F);
        const n = truncateTo(deep, 0);
        expect(n.path.map(s => s.id)).toEqual(['s1']);
        expect(currentOf(n)).toEqual(S);
    });

    it('un click fuori range si aggancia agli estremi invece di lanciare', () => {
        const deep = drillInto(navFor(S), P);
        expect(truncateTo(deep, 99).path).toHaveLength(2);
        expect(truncateTo(deep, -5).path).toHaveLength(1);
    });

    it('l\'etichetta e\' nome e metaclasse, come nel design', () => {
        expect(crumbLabel(P)).toBe('p2: Port');
    });

    it('un\'istanza senza nome mostra la sola metaclasse, non un due punti orfano', () => {
        expect(crumbLabel(step('x', '', 'Port'))).toBe('Port');
        expect(crumbLabel(step('x', '   ', 'Port'))).toBe('Port');
    });
});
