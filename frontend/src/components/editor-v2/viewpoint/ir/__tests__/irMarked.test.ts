/**
 * Unit tests for the `marked` predicate and the channel set (M1a, R-MK-1/5/7/10/11).
 *
 * Pure: draw ReadCtx + irCompile + irValidate are joiner-free, so they run in the
 * node vitest env. The marking source is a STUB injected into makeDrawReadCtx, not
 * the run-state singleton: these tests are about the operator and the channel, and
 * an injected Set keeps them free of the module-singleton coupling that would make
 * them order-dependent.
 *
 * DELIBERATE LIMIT — read before trusting a green run. Every assertion here is on
 * the DEPOSIT: that the operator compiles, that it reads isMarked, that the channel
 * is harvested. Nothing here proves the feature works on screen, because in this
 * commit nothing consumes `channels` yet (the dependency set of node and row views
 * has no production reader — discovery 2026-08-18, Q1). The consumption is asserted
 * by the tests of the next commit, and verified at the smoke.
 */
import { describe, it, expect } from 'vitest';
import { compileView, compileEdgeView, compileRowView, clearCompileCache } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import { validateIR } from '../irValidate';
import type { EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';

/** s1 --next--> s2, s1 --many--> [s2, s3]; s3 has no slots at all. */
function world(marked: Set<string> = new Set()) {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        R_next: { id: 'R_next', name: 'next' },
        R_many: { id: 'R_many', name: 'many' },
        s1: { id: 's1', name: 'obj_s1', instanceof: 'C_State', features: ['v1next', 'v1many'] },
        v1next: { id: 'v1next', instanceof: 'R_next', values: ['s2'] },
        v1many: { id: 'v1many', instanceof: 'R_many', values: ['s2', 's3'] },
        s2: { id: 's2', name: 'obj_s2', instanceof: 'C_State', features: [] },
        s3: { id: 's3', name: 'obj_s3', instanceof: 'C_State', features: [] },
    };
    return { idlookup, marked, ctx: makeDrawReadCtx(idlookup, (id: string) => marked.has(id)) };
}

const vertexIR = (over: Partial<VertexViewIR>): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
    shape: { form: 'rect' }, ...over,
} as VertexViewIR);

const edgeIR = (over: Partial<EdgeViewIR>): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'], edge: {}, ...over,
} as EdgeViewIR);

const rowIR = (over: Partial<RowViewIR>): RowViewIR => ({
    irVersion: 'ir-1.0', kind: 'row', metaclasses: ['State'],
    template: [{ from: 'intrinsic', prop: 'name' }], ...over,
} as RowViewIR);

describe('marked — no path (R-MK-1)', () => {
    it('reads the injected marking of self, both ways', () => {
        clearCompileCache();
        const { ctx, marked } = world();
        const compiled = compileView('v-marked', vertexIR({ predicate: { op: 'marked' } }));
        expect(compiled.predicate(ctx, 's1')).toBe(false);
        marked.add('s1');
        expect(compiled.predicate(ctx, 's1')).toBe(true);
        expect(compiled.predicate(ctx, 's2')).toBe(false);
    });

    it('is false — never undefined — on an element the lookup does not know', () => {
        clearCompileCache();
        const { ctx } = world(new Set(['s1']));
        const compiled = compileView('v-marked-unknown', vertexIR({ predicate: { op: 'marked' } }));
        expect(compiled.predicate(ctx, 'ghost')).toBe(false);
    });

    it('composes with not/and like any other predicate', () => {
        clearCompileCache();
        const { ctx, marked } = world();
        const compiled = compileView('v-marked-not', vertexIR({
            predicate: { op: 'and', args: [{ op: 'not', arg: { op: 'marked' } }, { op: 'literal', value: true }] },
        }));
        expect(compiled.predicate(ctx, 's1')).toBe(true);
        marked.add('s1');
        expect(compiled.predicate(ctx, 's1')).toBe(false);
    });

    it('adds nothing to the dependency set: a marking is not a feature (R-MK-5)', () => {
        clearCompileCache();
        const compiled = compileView('v-marked-deps', vertexIR({ predicate: { op: 'marked' } }));
        expect(compiled.dependencySet).toEqual([]);
        expect(compiled.crossPaths).toEqual([]);
    });
});

describe('marked — single-hop path (R-MK-10)', () => {
    const withPath = (viewId: string) =>
        compileView(viewId, vertexIR({ predicate: { op: 'marked', path: '$next.value' } }));

    it('asks the marking of the navigated target, not of self', () => {
        clearCompileCache();
        const { ctx, marked } = world();
        const compiled = withPath('v-path');
        expect(compiled.predicate(ctx, 's1')).toBe(false);
        marked.add('s2');                                  // the TARGET is marked
        expect(compiled.predicate(ctx, 's1')).toBe(true);
        marked.delete('s2');
        marked.add('s1');                                  // self marked, target not
        expect(compiled.predicate(ctx, 's1')).toBe(false);
    });

    it('is false when the slot is absent — the R-MK-7 fallback, with no throw', () => {
        clearCompileCache();
        const { ctx } = world(new Set(['s1', 's2', 's3']));
        const compiled = withPath('v-path-missing');
        expect(() => compiled.predicate(ctx, 's3')).not.toThrow();   // s3 has no features
        expect(compiled.predicate(ctx, 's3')).toBe(false);
    });

    it('is false on a whole-array hop (`values`), with no throw', () => {
        clearCompileCache();
        const { ctx } = world(new Set(['s2', 's3']));
        const compiled = compileView('v-path-values', vertexIR({
            predicate: { op: 'marked', path: '$many.values' },
        }));
        expect(() => compiled.predicate(ctx, 's1')).not.toThrow();
        expect(compiled.predicate(ctx, 's1')).toBe(false);
    });

    it('reads an indexed hop (`values[N]`)', () => {
        clearCompileCache();
        const { ctx, marked } = world();
        const compiled = compileView('v-path-indexed', vertexIR({
            predicate: { op: 'marked', path: '$many.values[1]' },
        }));
        expect(compiled.predicate(ctx, 's1')).toBe(false);
        marked.add('s3');                                  // many[1] === 's3'
        expect(compiled.predicate(ctx, 's1')).toBe(true);
    });

    it('puts the hop FEATURE in the dependency set, and no crossPath', () => {
        clearCompileCache();
        const compiled = withPath('v-path-deps');
        expect(compiled.dependencySet).toEqual(['next']);
        expect(compiled.crossPaths).toEqual([]);
    });

    it('rejects multi-hop at compile, naming the path', () => {
        clearCompileCache();
        expect(() => compileView('v-path-multi', vertexIR({
            predicate: { op: 'marked', path: '$next.value.$next.value' },
        }))).toThrow('[ir] marked.path supports a single reference hop in v1: $next.value.$next.value');
    });

    it('still rejects a forbidden PathExpr through the shared parser', () => {
        clearCompileCache();
        expect(() => compileView('v-path-forbidden', vertexIR({
            predicate: { op: 'marked', path: '$a?.b' },
        }))).toThrow(/forbidden construct/);
    });
});

describe('marked — the draw default (R-MK-4)', () => {
    it('is false for every element when no marking source is injected', () => {
        clearCompileCache();
        const { idlookup } = world(new Set(['s1', 's2']));
        const ctx = makeDrawReadCtx(idlookup);            // no second argument
        const self = compileView('v-default-self', vertexIR({ predicate: { op: 'marked' } }));
        const viaPath = compileView('v-default-path', vertexIR({ predicate: { op: 'marked', path: '$next.value' } }));
        expect(ctx.isMarked('s1')).toBe(false);
        expect(self.predicate(ctx, 's1')).toBe(false);
        expect(viaPath.predicate(ctx, 's1')).toBe(false);
    });
});

describe('channels — the declared channel set (R-MK-5)', () => {
    it('is harvested by compileView, including from a nested conditional', () => {
        clearCompileCache();
        const fromPredicate = compileView('v-ch-pred', vertexIR({ predicate: { op: 'marked' } }));
        expect(fromPredicate.channels).toEqual(['mark']);
        const fromFill = compileView('v-ch-fill', vertexIR({
            shape: { form: 'rect', fill: { when: { op: 'marked' }, then: '#ef4444', else: '#e2e8f0' } },
        }));
        expect(fromFill.channels).toEqual(['mark']);
    });

    it('is harvested by compileEdgeView and compileRowView', () => {
        clearCompileCache();
        const edge = compileEdgeView('e-ch', edgeIR({
            edge: { line: { color: { when: { op: 'marked' }, then: '#ef4444' } } },
        }));
        expect(edge.channels).toEqual(['mark']);
        const row = compileRowView('r-ch', rowIR({ visible: { when: { op: 'marked' }, then: true, else: false } }));
        expect(row.channels).toEqual(['mark']);
    });

    it('is deduped across several occurrences in the same view', () => {
        clearCompileCache();
        const compiled = compileView('v-ch-dup', vertexIR({
            predicate: { op: 'marked' },
            shape: {
                form: { when: { op: 'marked' }, then: 'ellipse', else: 'rect' },
                fill: { when: { op: 'marked' }, then: '#ef4444' },
            },
        }));
        expect(compiled.channels).toEqual(['mark']);
    });

    it('is ABSENT — not empty — on the three compiles when no view declares it', () => {
        clearCompileCache();
        const view = compileView('v-ch-none', vertexIR({ predicate: { op: 'isKind', class: 'State' } }));
        const edge = compileEdgeView('e-ch-none', edgeIR({}));
        const row = compileRowView('r-ch-none', rowIR({}));
        for (const compiled of [view, edge, row] as Array<{ channels?: string[] }>) {
            expect(compiled.channels).toBeUndefined();
            expect('channels' in compiled).toBe(false);
        }
    });

    it('does not leak between two compiles (the sink is installed per pass)', () => {
        clearCompileCache();
        compileView('v-ch-first', vertexIR({ predicate: { op: 'marked' } }));
        const second = compileView('v-ch-second', vertexIR({ predicate: { op: 'literal', value: true } }));
        expect(second.channels).toBeUndefined();
    });
});

describe('validateIR — closed vocabulary of Predicate.op (R-MK-11)', () => {
    /** The values this rule exists to catch live outside the type system (a hand
     *  written ir, an import, an AI guess), so they are written through `unknown`. */
    const withPredicate = (predicate: unknown): VertexViewIR =>
        vertexIR({ predicate } as Partial<VertexViewIR>);

    it('accepts a well-formed marked ir, with and without path', () => {
        clearCompileCache();
        expect(validateIR('v-ok-marked', withPredicate({ op: 'marked' }))).toEqual({ ok: true });
        clearCompileCache();
        expect(validateIR('v-ok-marked-path', withPredicate({ op: 'marked', path: '$next.value' })))
            .toEqual({ ok: true });
    });

    it('rejects an unknown operator, naming it and listing the vocabulary', () => {
        clearCompileCache();
        const r = validateIR('v-unknown', withPredicate({ op: 'zzzUnknown' }));
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.error).toContain('unknown predicate operator');
            expect(r.error).toContain('"zzzUnknown"');
            expect(r.error).toContain('marked');
            expect(r.error).not.toContain('split');   // NOT the bare TypeError of the default branch
        }
    });

    it('walks into and/or/not arguments', () => {
        clearCompileCache();
        const r = validateIR('v-unknown-nested', withPredicate({
            op: 'and',
            args: [{ op: 'literal', value: true }, { op: 'not', arg: { op: 'nope' } }],
        }));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('"nope"');
    });

    it('walks into the `when` of a Conditional', () => {
        clearCompileCache();
        const bad = vertexIR({ shape: { form: 'rect', fill: { when: { op: 'nope2' }, then: '#fff' } } as any });
        const r = validateIR('v-unknown-cond', bad);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('"nope2"');
    });

    it('walks into a graphVertex childFilter and an edge predicate', () => {
        clearCompileCache();
        const gv = {
            irVersion: 'ir-1.2', kind: 'graphVertex', metaclasses: ['State'],
            shape: { form: 'rect' }, containment: { childFilter: { op: 'nope3' } },
        } as any;
        const r1 = validateIR('gv-unknown', gv);
        expect(r1.ok).toBe(false);
        if (!r1.ok) expect(r1.error).toContain('"nope3"');

        clearCompileCache();
        const r2 = validateIR('e-unknown', edgeIR({ predicate: { op: 'nope4' } as any }));
        expect(r2.ok).toBe(false);
        if (!r2.ok) expect(r2.error).toContain('"nope4"');
    });

    it('surfaces the multi-hop marked.path rejection as a readable authoring error', () => {
        clearCompileCache();
        const r = validateIR('v-multi', withPredicate({ op: 'marked', path: '$next.value.$next.value' }));
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toContain('single reference hop');
    });

    it('leaves every pre-existing operator accepted (no vocabulary regression)', () => {
        for (const [i, predicate] of ([
            { op: 'literal', value: true },
            { op: 'exists', path: '$next.value' },
            { op: 'empty', path: '$next.value' },
            { op: 'isKind', class: 'State' },
            { op: 'eq', left: '$next.value', right: { kind: 'string', value: 'x' } },
            { op: 'or', args: [{ op: 'literal', value: false }, { op: 'marked' }] },
        ] as unknown[]).entries()) {
            clearCompileCache();
            expect(validateIR(`v-vocab-${i}`, withPredicate(predicate))).toEqual({ ok: true });
        }
    });
});
