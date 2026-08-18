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
import { getIRIndex } from '../irResolveCore';
import type { AnyViewIR, EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';

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

// ---------------------------------------------------------------------------
// M1b — the consumption half. The tests above assert that the channel is
// DEPOSITED; these assert that the index EXPOSES it and that the gate the three
// resolution surfaces carry has the semantics the restrictive clause requires.
// ---------------------------------------------------------------------------

/** Fake DState slice for getIRIndex (same shape as ir.test.ts's builder). */
function stateWith(views: { id: string; ir: AnyViewIR }[]) {
    const idlookup: Record<string, any> = { ...world().idlookup };
    const viewelements: string[] = [];
    for (const v of views) {
        idlookup[v.id] = { id: v.id, viewpoint: 'VP', ir: v.ir };
        viewelements.push(v.id);
    }
    return { viewpoint: 'VP', viewelements, idlookup };
}

describe('channelsInUse — the index-level union (R-MK-5/R-MK-6)', () => {
    it('unions the channels of node, row and edge entries', () => {
        clearCompileCache();
        const state = stateWith([
            { id: 'V_plain', ir: vertexIR({ predicate: { op: 'isKind', class: 'State' } }) },
            { id: 'V_marked', ir: vertexIR({ shape: { form: 'rect', fill: { when: { op: 'marked' }, then: '#ef4444' } } }) },
            { id: 'R_marked', ir: rowIR({ visible: { when: { op: 'marked' }, then: true, else: false } }) },
            { id: 'E_plain', ir: edgeIR({}) },
        ]);
        const index = getIRIndex(state, 'sig-ch-mixed')!;
        expect(index).not.toBeNull();
        expect([...(index.channelsInUse ?? [])]).toEqual(['mark']);
    });

    it('is EMPTY when no view of the viewpoint declares a channel', () => {
        clearCompileCache();
        const state = stateWith([
            { id: 'V_a', ir: vertexIR({}) },
            { id: 'R_a', ir: rowIR({}) },
            { id: 'E_a', ir: edgeIR({}) },
        ]);
        const index = getIRIndex(state, 'sig-ch-empty')!;
        expect(index.channelsInUse?.size).toBe(0);
        expect(index.channelsInUse?.has('mark')).toBe(false);
    });

    it('picks the channel up from an EDGE view alone (the surface oaeSlotsSig cannot see)', () => {
        clearCompileCache();
        const state = stateWith([
            { id: 'V_b', ir: vertexIR({}) },
            { id: 'E_marked', ir: edgeIR({ edge: { line: { color: { when: { op: 'marked' }, then: '#ef4444' } } } }) },
        ]);
        const index = getIRIndex(state, 'sig-ch-edge-only')!;
        expect(index.channelsInUse?.has('mark')).toBe(true);
    });

    it('picks the channel up from a view whose predicate reads a marked TARGET', () => {
        clearCompileCache();
        const state = stateWith([
            { id: 'V_path', ir: vertexIR({ predicate: { op: 'marked', path: '$next.value' } }) },
        ]);
        const index = getIRIndex(state, 'sig-ch-path')!;
        expect(index.channelsInUse?.has('mark')).toBe(true);
    });
});

describe('the declared-channel gate (R-MK-5, restrictive clause of spec sez. 9)', () => {
    /**
     * MIRRORED LITERAL, not the production expression. useIRView, useIRRowView and
     * useIRContainment are React hooks and are not import-safe in the node vitest env,
     * so — as edgeAuthoring.test.ts does for the authoring panels — the gate is
     * asserted here as the same one-line expression the three of them carry:
     *
     *     const markDep = index?.channelsInUse?.has('mark') ? markVersion : 0;
     *
     * What this pins is the SEMANTICS, which the smoke then confirms on screen: the
     * resolution signature MOVES with the bump when the channel is declared, and is a
     * constant when it is not. The second assertion is the restrictive clause, not a
     * detail: it is what keeps a viewpoint that never reads `marked` re-resolving
     * exactly as it did before this slice.
     */
    const gate = (index: { channelsInUse?: ReadonlySet<string> } | null, markVersion: number): number =>
        (index?.channelsInUse?.has('mark') ? markVersion : 0);

    const indexOf = (views: { id: string; ir: AnyViewIR }[], sig: string) => {
        clearCompileCache();
        return getIRIndex(stateWith(views), sig);
    };

    it('moves with the bump when the index declares the channel', () => {
        const index = indexOf(
            [{ id: 'V_m', ir: vertexIR({ predicate: { op: 'marked' } }) }],
            'sig-gate-declared',
        );
        expect(gate(index, 7)).toBe(7);
        expect(gate(index, 8)).toBe(8);
        expect(gate(index, 8)).not.toBe(gate(index, 7));
    });

    it('is a constant across bumps when the index does NOT declare it', () => {
        const index = indexOf(
            [{ id: 'V_n', ir: vertexIR({ predicate: { op: 'isKind', class: 'State' } }) }],
            'sig-gate-undeclared',
        );
        expect(gate(index, 7)).toBe(0);
        expect(gate(index, 8)).toBe(0);
        expect(gate(index, 8)).toBe(gate(index, 7));
    });

    it('is a constant when there is no IR index at all (non-IR viewpoint)', () => {
        expect(gate(null, 42)).toBe(0);
    });
});
