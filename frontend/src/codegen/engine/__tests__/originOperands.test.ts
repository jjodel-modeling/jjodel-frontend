/**
 * origin per operand — rule 1 through `+`, `map` and `join` (P-2026-10-31-1341; discovery
 * docs/discovery/discovery_2026-10-31_codegen_origins_through_concat.md).
 *
 * A member read that is an operand of a plain string `+`, or the lambda body of a `map` whose items a `join` joins,
 * gets its model origin as it would in a hole of its own; the other pieces stay opaque, and every value is the one
 * the evaluator computes without a host. Executed through `generate` over a synthetic record shaped like
 * `buildEvalContext`'s, as in origin.test.ts. Mutations each test kills are in its name; the bench is in the commit
 * body.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect, afterEach } from 'vitest';
import { EvaluationContext, JjelEvaluator, parseTemplate } from '../../../jjel';
import { generate } from '../generate';
import { OriginHost } from '../origin';
import type { GenerateResult } from '../generate';
import type { TemplateRecord } from '../templates';
import type { Text } from '../text';
import { EXAMPLES, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';
import { readModelGenerators } from '../generatorCodec';

/** r1 (`name` = 'req', `width` = 4) and r2 (`name` = 'ack', `width` = 1), two Signals. */
function fixture() {
    const lookup: Record<string, any> = {
        MM: { className: 'DModel', id: 'MM', name: 'mm' },
        M: { className: 'DModel', id: 'M', name: 'm', instanceof: 'MM' },
        r1: { className: 'DObject', id: 'r1', name: 'r1', father: 'M', features: ['v_r1_name', 'v_r1_width'] },
        r2: { className: 'DObject', id: 'r2', name: 'r2', father: 'M', features: ['v_r2_name', 'v_r2_width'] },
        v_r1_name: { className: 'DValue', id: 'v_r1_name', instanceof: 'A_name', values: ['req'], father: 'r1' },
        v_r1_width: { className: 'DValue', id: 'v_r1_width', instanceof: 'A_width', values: [4], father: 'r1' },
        v_r2_name: { className: 'DValue', id: 'v_r2_name', instanceof: 'A_name', values: ['ack'], father: 'r2' },
        v_r2_width: { className: 'DValue', id: 'v_r2_width', instanceof: 'A_width', values: [1], father: 'r2' },
        A_name: { className: 'DAttribute', id: 'A_name', name: 'name' },
        A_width: { className: 'DAttribute', id: 'A_width', name: 'width' },
    };
    const r1 = { id: 'r1', __type: 'Object', name: 'req', width: 4 };
    const r2 = { id: 'r2', __type: 'Object', name: 'ack', width: 1 };
    return { lookup, globals: { instances: [r1, r2], r1, r2, signals: [r1, r2] } as Record<string, any> };
}

const NAME = (id: string) => ({ kind: 'model', elementId: id, feature: 'A_name', featureName: 'name', transformation: { name: 'identity' }, template: 'main' });

function gen(templates: TemplateRecord[]): GenerateResult {
    const { lookup, globals } = fixture();
    return generate(globals, lookup, 'M', templates, 'main');
}

const main = (body: string, mode?: 'text' | 'expression'): TemplateRecord => ({ name: 'main', params: [], body, ...(mode ? { mode } : {}) });

/** The output ranges with a model origin: their text and origin. */
function modelRanges(out: GenerateResult) {
    return out.map.filter(e => e.origin.kind === 'model').map(e => [out.code.slice(e.start, e.end), e.start, e.end, e.origin]);
}

describe('a member read inside a plain string +', () => {
    it('an expression template "logic " + r.name + ";" links exactly the characters of r.name to (r, name) (mutant: operands through toText)', () => {
        const out = gen([main('"logic " + r1.name + ";"')]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('logic req;');
        expect(modelRanges(out)).toEqual([['req', 6, 9, NAME('r1')]]);
        expect(out.text.fragments.map(f => [f.text, f.kind])).toEqual([['logic ', 'opaque'], ['req', 'model'], [';', 'opaque']]);
    });

    it('in a hole too, each operand by the rules: two reads, two model ranges (mutant: the assembly not looked up at a hole)', () => {
        const out = gen([main('"<${r1.name + ", " + r2.name}>"')]);
        expect(out.code).toBe('<req, ack>');
        expect(modelRanges(out)).toEqual([['req', 1, 4, NAME('r1')], ['ack', 6, 9, NAME('r2')]]);
    });

    it('an operand that is no member read stays opaque with its own reads (mutant: reads of an operand frame dropped)', () => {
        const out = gen([main('"w" + (r1.width * 2)')]);
        expect(out.code).toBe('w8');
        const op = out.text.fragments.find(f => f.text === '8')!;
        expect(op.origin).toEqual({ kind: 'opaque', reads: [{ elementId: 'r1', feature: 'A_width', featureName: 'width' }], template: 'main' });
    });

    it('a + mixing a Text from a template call and a member read keeps both origins (mutant: the Text branch through toText)', () => {
        const out = gen([
            main('nm(r1) + " = " + r2.name'),
            { name: 'nm', params: ['x'], body: '${x.name}', mode: 'text' },
        ]);
        expect(out.code).toBe('req = ack');
        expect(modelRanges(out).map(r => [r[0], (r[3] as any).elementId])).toEqual([['req', 'r1'], ['ack', 'r2']]);
    });

    it('a hole over a + that is no assembly is opaque with the operands\' reads (mutant: operand reads not passed to the enclosing frame)', () => {
        const out = gen([main('"${("x" + r1.name).toUpper}"')]);
        expect(out.code).toBe('XREQ');
        expect(out.text.fragments[0].origin).toEqual({ kind: 'opaque', reads: [{ elementId: 'r1', feature: 'A_name', featureName: 'name' }], template: 'main' });
    });

    it('a + whose operands do not print as the value makes no assembly: "a" + [1, 2] is a1,2 (mutant: assembly recorded unchecked)', () => {
        const out = gen([main('"a" + [1, 2]')]);
        expect(out.code).toBe('a1,2');
        expect(out.text.fragments.map(f => f.kind)).toEqual(['opaque']);
    });

    it('the value of a + under the host is still a string: string methods on it work (mutant: + returns a Text)', () => {
        const out = gen([main('("x" + r1.name).toUpper + ("" + r2.name).length')]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('XREQ3');
    });
});

describe('the items of map(r => r.name).join(sep)', () => {
    it('in an expression template, each item links to its element (mutant: map items not kept)', () => {
        const out = gen([main('signals.map(r => r.name).join(", ")')]);
        expect(out.code).toBe('req, ack');
        expect(modelRanges(out)).toEqual([['req', 0, 3, NAME('r1')], ['ack', 5, 8, NAME('r2')]]);
    });

    it('in a hole of a text template, the same (mutant: join without its call node)', () => {
        const out = gen([main('wire ${signals.map(r => r.name).join(" | ")};', 'text')]);
        expect(out.code).toBe('wire req | ack;');
        expect(modelRanges(out).map(r => [r[0], r[1], (r[3] as any).elementId])).toEqual([['req', 5, 'r1'], ['ack', 11, 'r2']]);
    });

    it('a lambda body that is itself a + keeps one assembly per item (mutant: the assembly read at join time, not per item)', () => {
        const out = gen([main('signals.map(r => "logic " + r.name + ";").join("\\n")')]);
        expect(out.code).toBe('logic req;\nlogic ack;');
        expect(modelRanges(out).map(r => (r[3] as any).elementId)).toEqual(['r1', 'r2']);
    });

    it('a join with a Text item attributes the plain items by their lambda body (mutant: the Text join through toText)', () => {
        const out = gen([
            main('signals.map(r => r.name).join(nm(r1))'),
            { name: 'nm', params: ['x'], body: '${x.name}', mode: 'text' },
        ]);
        expect(out.code).toBe('reqreqack');
        expect(modelRanges(out).map(r => (r[3] as any).elementId)).toEqual(['r1', 'r1', 'r2']);
    });
});

describe('values are the evaluator\'s own', () => {
    const exprs = ['"logic " + r1.name + ";"', 'signals.map(r => r.name).join(", ")', 'r1.width + r2.width', '"n" + r1.width + null', 'signals.map(r => r.width)'];

    it.each(exprs)('%s: the same value with and without a text host', expr => {
        const { lookup, globals } = fixture();
        const parsed = parseTemplate(expr);
        const bare = new JjelEvaluator(new EvaluationContext(globals)).evaluate(parsed.expression!);
        const ctx = new EvaluationContext(globals);
        const host = new OriginHost(lookup, { holePosition: () => null, templateAt: () => '', literalFragments: () => [] } as any);
        ctx.textHost = host;
        ctx.readObserver = host.observe;
        expect(new JjelEvaluator(ctx).evaluate(parsed.expression!)).toEqual(bare);
    });
});

describe('the lecture examples generate byte-identical code', () => {
    const proto = OriginHost.prototype as any;
    const saved = { evaluateConcat: proto.evaluateConcat, evaluatePart: proto.evaluatePart, mapItems: proto.mapItems, evaluateJoin: proto.evaluateJoin, evaluateBody: proto.evaluateBody };
    afterEach(() => Object.assign(proto, saved));
    const sha = (v: string): string => createHash('sha256').update(v).digest('hex');

    it.each(EXAMPLES)('%s: code with operand origins equals code with the hooks off (mutant: an assembly that does not join to its value)', name => {
        const ex = loadExample(name);
        const def = readModelGenerators(ex.lookup, ex.modelId).generators[0];
        const now = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def.templates, 'main');
        Object.assign(proto, { evaluateConcat: undefined, evaluatePart: undefined, mapItems: undefined, evaluateJoin: undefined });
        proto.evaluateBody = function (this: OriginHost, _expr: unknown, evaluate: () => any): Text { return this.toText(evaluate()); };
        const before = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, def.templates, 'main');
        expect(now.errors).toEqual([]);
        expect(sha(now.code)).toBe(sha(before.code));
    });
});
