/**
 * Asse marker (2026-08-15): integrita' della tabella dati, fallback del lookup,
 * compilazione del campo `shape.marker` come Conditional per istanza.
 *
 * Il registry e' un vocabolario aperto (precedente: BadgeSpec.icon): un id fuori
 * tabella non disegna nulla e non e' un errore. Questi test fissano il contratto
 * della tabella (id coerenti, path disegnabili) e la semantica del compile, non
 * i glifi: i path sono dati e possono crescere liberamente.
 */

import { describe, it, expect } from 'vitest';
import { MARKER_REGISTRY, MARKER_STROKE_WIDTH, MARKER_VIEWBOX, getMarkerDef } from '../markerRegistry';
import { SVG_BORDER_DASH } from '../shapeRegistry';
import { compileView, clearCompileCache } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { VertexViewIR } from '../irTypes';

/** Mondo D-layer minimo, stesso pattern di ir.test.ts: due gateway con `kind` diverso. */
function world() {
    const idlookup: Record<string, any> = {
        C_Gateway: { id: 'C_Gateway', name: 'Gateway', extends: [] },
        A_kind: { id: 'A_kind', name: 'kind' },
        g1: { id: 'g1', name: 'g1', instanceof: 'C_Gateway', features: ['v1k'] },
        v1k: { id: 'v1k', instanceof: 'A_kind', values: ['exclusive'] },
        g2: { id: 'g2', name: 'g2', instanceof: 'C_Gateway', features: ['v2k'] },
        v2k: { id: 'v2k', instanceof: 'A_kind', values: ['parallel'] },
    };
    return { idlookup, ctx: makeDrawReadCtx(idlookup) };
}

function vertexIR(over: Partial<VertexViewIR>): VertexViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Gateway'],
        shape: { form: 'diamond' }, ...over,
    } as VertexViewIR;
}

describe('markerRegistry', () => {
    it('id coerente con la chiave, label presente, almeno un path', () => {
        for (const [key, def] of Object.entries(MARKER_REGISTRY)) {
            expect(def.id).toBe(key);
            expect(def.label.length).toBeGreaterThan(0);
            expect(def.paths.length).toBeGreaterThan(0);
        }
    });

    it('ogni path e un comando SVG assoluto non vuoto', () => {
        for (const def of Object.values(MARKER_REGISTRY)) {
            for (const p of def.paths) {
                expect(p.d.startsWith('M')).toBe(true);
                expect(p.d.trim().length).toBeGreaterThan(1);
                if (p.fill !== undefined) expect(typeof p.fill).toBe('boolean');
            }
        }
    });

    it('copre i marker nominati dall inventario 2026-08-14', () => {
        // La vetrina dell'inventario nomina questi; il resto della tabella e'
        // libero di crescere senza toccare questo test.
        for (const id of ['x', 'plus', 'circle', 'envelope', 'clock', 'history', 'history-deep', 'dot']) {
            expect(MARKER_REGISTRY[id]).toBeDefined();
        }
    });

    it('getMarkerDef: id assente, vuoto o sconosciuto => undefined', () => {
        expect(getMarkerDef(undefined)).toBeUndefined();
        expect(getMarkerDef('')).toBeUndefined();
        expect(getMarkerDef('marker-inesistente')).toBeUndefined();
        expect(getMarkerDef('x')).toBe(MARKER_REGISTRY.x);
    });

    it('costanti di resa: viewBox 0..100 e stroke in unita di viewBox', () => {
        expect(MARKER_VIEWBOX).toBe('0 0 100 100');
        expect(MARKER_STROKE_WIDTH).toBeGreaterThan(0);
        expect(MARKER_STROKE_WIDTH).toBeLessThan(100);
    });
});

/**
 * Token dots of a Petri place (P-2026-09-29-0939, lane 1 of
 * docs/discovery/discovery_2026-09-29_petri_notation.md): `dots-n` draws n
 * filled dots, smaller than the single `dot`, inside the glyph box, apart, and
 * centred as a group. The geometry is read from the path data, so a moved or
 * dropped dot fails here, not only on screen.
 */
describe('markerRegistry: token dots', () => {
    /** One filled circle per path, written `M x-r,y A r,r 0 1,0 x+r,y A r,r 0 1,0 x-r,y`. */
    const CIRCLE = /^M([\d.]+),([\d.]+) A([\d.]+),([\d.]+) 0 1,0 ([\d.]+),([\d.]+) A([\d.]+),([\d.]+) 0 1,0 ([\d.]+),([\d.]+)$/;
    function circle(d: string): { cx: number; cy: number; r: number } {
        const m = CIRCLE.exec(d);
        if (!m) throw new Error(`not a circle path: ${d}`);
        const [x0, y0, r1, r2, x1, y1, r3, r4, x2, y2] = m.slice(1).map(Number);
        expect([r2, r3, r4]).toEqual([r1, r1, r1]);
        expect(y1).toBe(y0);
        expect([x2, y2]).toEqual([x0, y0]);
        expect(x1 - x0).toBe(2 * r1);
        return { cx: x0 + r1, cy: y0, r: r1 };
    }
    const dotRadius = circle(MARKER_REGISTRY.dot.paths[0].d).r;

    for (const n of [2, 3, 4]) {
        it(`dots-${n}: ${n} filled dots, smaller than dot, inside 26..74, apart, centred on (50,50)`, () => {
            const def = getMarkerDef(`dots-${n}`);
            expect(def).toBeDefined();
            expect(def!.paths).toHaveLength(n);
            const dots = def!.paths.map(p => {
                expect(p.fill).toBe(true);
                return circle(p.d);
            });
            for (const { cx, cy, r } of dots) {
                expect(r).toBeLessThan(dotRadius);
                expect(cx - r).toBeGreaterThanOrEqual(26);
                expect(cx + r).toBeLessThanOrEqual(74);
                expect(cy - r).toBeGreaterThanOrEqual(26);
                expect(cy + r).toBeLessThanOrEqual(74);
            }
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const gap = Math.hypot(dots[i].cx - dots[j].cx, dots[i].cy - dots[j].cy) - dots[i].r - dots[j].r;
                    expect(gap, `dots ${i} and ${j} of dots-${n}`).toBeGreaterThan(0);
                }
            }
            const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
            expect(Math.abs(mean(dots.map(d => d.cx)) - 50)).toBeLessThanOrEqual(1);
            expect(Math.abs(mean(dots.map(d => d.cy)) - 50)).toBeLessThanOrEqual(2);
        });
    }
});

describe('asse bordo: double', () => {
    it('double sta nella mappa dash come tratto pieno (il raddoppio e overdraw)', () => {
        expect('double' in SVG_BORDER_DASH).toBe(true);
        expect(SVG_BORDER_DASH.double).toBeUndefined();
        // le chiavi preesistenti non cambiano
        expect(SVG_BORDER_DASH.dashed).toBe('6 4');
        expect(SVG_BORDER_DASH.dotted).toBe('1 4');
    });
});

describe('compile di shape.marker', () => {
    it('assente => compiled.marker null (nessun layer, default inerte)', () => {
        clearCompileCache();
        const cv = compileView('v_nomark', vertexIR({}));
        expect(cv.marker).toBeNull();
    });

    it('scalare => id costante per ogni istanza', () => {
        clearCompileCache();
        const { ctx } = world();
        const cv = compileView('v_mark_s', vertexIR({ shape: { form: 'diamond', marker: 'x' } }));
        expect(cv.marker).not.toBeNull();
        expect(cv.marker!(ctx, 'g1')).toBe('x');
        expect(cv.marker!(ctx, 'g2')).toBe('x');
    });

    it('conditional => marker per istanza, e il predicato entra nel dependencySet', () => {
        clearCompileCache();
        const { ctx } = world();
        const cv = compileView('v_mark_c', vertexIR({
            shape: {
                form: 'diamond',
                marker: {
                    rules: [
                        { when: { op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'exclusive' } }, then: 'x' },
                        { when: { op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'parallel' } }, then: 'plus' },
                    ],
                    default: '',
                },
            },
        }));
        expect(cv.marker!(ctx, 'g1')).toBe('x');
        expect(cv.marker!(ctx, 'g2')).toBe('plus');
        expect(cv.dependencySet).toContain('kind');
    });
});
