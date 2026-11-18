import { describe, it, expect, vi } from 'vitest';

/**
 * A `forall` with several variables iterates the cartesian product, first
 * variable outermost, and puts every created object into one flat list
 * (P-2026-11-02-1331, R-FA-1, R-FA-2, R-FA-7).
 *
 * The case that asked for it: "no two grants at the same time" over the
 * requesters of an arbiter, lowered to one conjunction of `!(grant_q & grant_r)`.
 * With two nested one-variable foralls the conjunction is a tree, one `Conj` per
 * requester, the last one empty.
 *
 * The joiner barrel is mocked (see contained-sources.test.ts for why); the
 * executor itself runs unstubbed. Each case runs on both parser paths.
 */
vi.mock('../../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../../parser/parser';
import { execute } from '../executor';
import type { TransformationAST } from '../../types/ast';

const HEAD = 'transformation Arb2Prop\nfrom Arb\nto Prop\n\n';

const PROP = {
    classes: [
        { className: 'DClass', name: 'Property', allAttributes: [{ name: 'name' }],
            allReferences: [{ name: 'expr', composition: true, type: { name: 'Conj' } }] },
        { className: 'DClass', name: 'Conj', allAttributes: [],
            allReferences: [{ name: 'ops', composition: true, type: { name: 'Expr' } }] },
        { className: 'DClass', name: 'Neg', allAttributes: [],
            allReferences: [{ name: 'op', composition: true, type: { name: 'Expr' } }] },
        { className: 'DClass', name: 'Ref', allAttributes: [{ name: 'name' }], allReferences: [] },
        { className: 'DClass', name: 'Pair', allAttributes: [{ name: 'hi' }, { name: 'lo' }], allReferences: [] },
    ],
};

const SOURCE = [
    { id: 'A', name: 'arb', className: 'Arbiter', __type: 'Arbiter',
        requesters: [{ __ref: 'R1' }, { __ref: 'R2' }, { __ref: 'R3' }], others: [] },
    { id: 'R1', name: 'cpu', className: 'Requester', __type: 'Requester', priority: 1, peers: [{ __ref: 'R2' }] },
    { id: 'R2', name: 'dma', className: 'Requester', __type: 'Requester', priority: 2, peers: [{ __ref: 'R3' }, { __ref: 'R1' }] },
    { id: 'R3', name: 'io', className: 'Requester', __type: 'Requester', priority: 3, peers: [] },
];

function parseJjtl(source: string, withSource: boolean): TransformationAST {
    const { tokens } = new JjtlLexer(source).tokenize();
    const { ast, errors } = withSource ? new JjtlParser(tokens, source).parse() : new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    return ast!;
}

async function run(body: string, withSource: boolean): Promise<any> {
    const result: any = await execute(parseJjtl(HEAD + body, withSource), SOURCE, PROP);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    return result.targetModel.roots[0];
}

/** The pairs of `-> expr { -> Conj { -> ops { forall ... -> Pair { hi, lo } } } }`. */
async function pairs(forall: string, withSource: boolean): Promise<string[][]> {
    const prop = await run(`Arbiter a -> Property {
    -> expr { -> Conj { -> ops {
        ${forall} -> Pair {
            hi := q.name
            lo := r.name
        }
    } } }
}`, withSource);
    expect(Array.isArray(prop.expr.ops)).toBe(true);
    return prop.expr.ops.map((p: any) => [p.hi, p.lo]);
}

const render = (e: any): string => {
    if (e.__type === 'Ref') return e.name;
    if (e.__type === 'Neg') return `!(${render(e.op)})`;
    if (e.__type === 'Conj') return (Array.isArray(e.ops) ? e.ops : [e.ops]).map(render).join(' & ');
    return JSON.stringify(e);
};

describe.each([
    ['without source (legacy expression path)', false],
    ['with source (JjEL delegation)', true],
])('multi-variable forall, %s', (_label, withSource) => {

    it('two variables over one collection, a filter relating them: the pairs in order, flat', async () => {
        expect(await pairs('forall q, r in requesters such that r.priority > q.priority', withSource))
            .toEqual([['cpu', 'dma'], ['cpu', 'io'], ['dma', 'io']]);
    });

    it('without a filter the product is full: (a, a) and both orders', async () => {
        expect(await pairs('forall q in requesters, r in requesters', withSource)).toEqual([
            ['cpu', 'cpu'], ['cpu', 'dma'], ['cpu', 'io'],
            ['dma', 'cpu'], ['dma', 'dma'], ['dma', 'io'],
            ['io', 'cpu'], ['io', 'dma'], ['io', 'io'],
        ]);
    });

    it('a later collection reads an earlier variable', async () => {
        expect(await pairs('forall q in requesters, r in q.peers', withSource))
            .toEqual([['cpu', 'dma'], ['dma', 'io'], ['dma', 'cpu']]);
    });

    it('three variables, both spellings mixed', async () => {
        const prop = await run(`Arbiter a -> Property {
    -> expr { -> Conj { -> ops {
        forall q, s in requesters, r in q.peers such that s.name == r.name -> Pair {
            hi := q.name + s.name
            lo := r.name
        }
    } } }
}`, withSource);
        expect(prop.expr.ops.map((p: any) => [p.hi, p.lo]))
            .toEqual([['cpudma', 'dma'], ['dmacpu', 'cpu'], ['dmaio', 'io']]);
    });

    it('an empty product creates nothing, without a warning', async () => {
        expect(await pairs('forall q in requesters, r in others', withSource)).toEqual([]);
    });

    it('the variable of an enclosing forall is visible in the filter and in the body', async () => {
        const prop = await run(`Arbiter a -> Property {
    -> expr { -> Conj { -> ops {
        forall o in requesters such that o.name == "dma" -> Conj {
            -> ops {
                forall q, r in requesters such that q.name == o.name and r.priority < o.priority -> Pair {
                    hi := o.name + q.name
                    lo := r.name
                }
            }
        }
    } } }
}`, withSource);
        expect(prop.expr.ops.length).toBe(1);
        expect(prop.expr.ops[0].ops.map((p: any) => [p.hi, p.lo])).toEqual([['dmadma', 'cpu']]);
    });

    it('a let binding is visible in the body', async () => {
        const prop = await run(`Arbiter a -> Property {
    let $g = "grant_" in {
        -> expr { -> Conj { -> ops {
            forall q, r in requesters such that r.priority > q.priority -> Pair {
                hi := $g + q.name
                lo := $g + r.name
            }
        } } }
    }
}`, withSource);
        expect(prop.expr.ops.map((p: any) => [p.hi, p.lo]))
            .toEqual([['grant_cpu', 'grant_dma'], ['grant_cpu', 'grant_io'], ['grant_dma', 'grant_io']]);
    });

    it('the arbiter case: one Conj with three Neg operands', async () => {
        const prop = await run(`Arbiter a -> Property {
    name := "mutex"
    -> expr { -> Conj { -> ops {
        forall q in requesters, r in requesters such that r.priority > q.priority -> Neg {
            -> op { -> Conj { -> ops {
                forall s in requesters such that s.name == q.name or s.name == r.name -> Ref { name := "grant_" + s.name + "_r" }
            } } }
        }
    } } }
}`, withSource);
        expect(prop.expr.__type).toBe('Conj');
        expect(prop.expr.ops.map((n: any) => n.__type)).toEqual(['Neg', 'Neg', 'Neg']);
        expect(render(prop.expr))
            .toBe('!(grant_cpu_r & grant_dma_r) & !(grant_cpu_r & grant_io_r) & !(grant_dma_r & grant_io_r)');
    });
});

describe('the JjEL route gives the same pairs (with source only)', () => {
    // The collection of a forall is parsed by the legacy expression parser, which has no
    // object literal (discovery_2026-11-02_jjtl_forall_multivar.md F5), so the list is
    // bound by `let`, whose value JjEL parses.
    it('iterates a list of object literals and reads pr.hi.name', async () => {
        const prop = await run(`Arbiter a -> Property {
    let $pairs = requesters.flatMap(q => requesters.filter(r => r.priority > q.priority).map(r => { hi: q, lo: r })) in {
        -> expr { -> Conj { -> ops {
            forall pr in $pairs -> Pair {
                hi := pr.hi.name
                lo := pr.lo.name
            }
        } } }
    }
}`, true);
        expect(prop.expr.ops.map((p: any) => [p.hi, p.lo]))
            .toEqual(await pairs('forall q, r in requesters such that r.priority > q.priority', true));
    });
});

describe('a JjEL collection written directly in the forall (with source only, P-2026-11-02-2345)', () => {
    const PAIRS = 'requesters.flatMap(q => requesters.filter(r => r.priority > q.priority).map(r => { hi: q, lo: r }))';

    async function direct(forall: string, body: string): Promise<string[][]> {
        const prop = await run(`Arbiter a -> Property {
    -> expr { -> Conj { -> ops {
        ${forall} -> Pair {
            ${body}
        }
    } } }
}`, true);
        return prop.expr.ops.map((p: any) => [p.hi, p.lo]);
    }

    it('gives the same pairs as the `let` form', async () => {
        expect(await direct(`forall pr in ${PAIRS}`, 'hi := pr.hi.name\n            lo := pr.lo.name'))
            .toEqual([['cpu', 'dma'], ['cpu', 'io'], ['dma', 'io']]);
    });

    it('a filter after the collection', async () => {
        expect(await direct(`forall pr in ${PAIRS} such that pr.hi.name == "cpu"`, 'hi := pr.hi.name\n            lo := pr.lo.name'))
            .toEqual([['cpu', 'dma'], ['cpu', 'io']]);
    });

    it('a second variable and a filter after the collection', async () => {
        expect(await direct(`forall pr in ${PAIRS}, s in requesters such that s.name == pr.lo.name`,
            'hi := pr.hi.name + s.name\n            lo := s.name'))
            .toEqual([['cpudma', 'dma'], ['cpuio', 'io'], ['dmaio', 'io']]);
    });
});
