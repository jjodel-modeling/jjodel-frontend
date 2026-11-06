/**
 * The generation budget (slice S7, P-2026-10-23-2145; R-GEN-28, discovery 2026-10-23 §4.2).
 *
 * A fan-out template stops with one error under an injected clock; the output cap trips past the bound and not at
 * it; a tripped budget stays tripped (the budget alone, a hole's `catch`, a whole generation); an ordinary
 * generation, the two lecture examples, gives the same code, map and errors under the default budget as with no
 * limit. Each test name says which break kills it.
 */

import { describe, it, expect } from 'vitest';
import { createFunction } from '../../../jjel';
import type { JjelExpression, JjelValue } from '../../../jjel';
import { generate } from '../generate';
import { OriginHost, TemplateSources } from '../origin';
import { readModelTemplates } from '../templateCodec';
import type { TemplateRecord } from '../templates';
import { EMPTY_TEXT, GenerationBudget, fragment, makeText, textLength } from '../text';
import { EXAMPLES, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';

const AT = { template: 't', offset: 0, line: 1, column: 1 };

/** A clock that moves `step` ms each time it is read. */
function ticking(step: number) {
    let t = 0;
    const clock = { reads: 0, now: () => { clock.reads++; return (t += step); } };
    return clock;
}

const run = (templates: TemplateRecord[], args: JjelValue[] = [], limits = {}, globals: Record<string, JjelValue> = {}) =>
    generate(globals, {}, 'm', templates, 'main', args, limits);

/** Two self-calls per level: under the depth bound of 64 at any `n`, and 2^(n+1) - 1 calls. */
const FAN_OUT: TemplateRecord[] = [
    { name: 'main', params: ['n'], body: '${f(n)}', mode: 'text' },
    { name: 'f', params: ['n'], body: '${if n > 0 then f(n - 1) else "x"}${if n > 0 then f(n - 1) else "x"}', mode: 'text' },
];

describe('the time budget', () => {
    it('a fan-out template stops with one error and no code, the message of the discovery (mutant: call and hole checkpoints removed)', () => {
        const clock = ticking(50);
        const out = run(FAN_OUT, [16], { now: clock.now });
        expect(out.errors).toHaveLength(1);
        expect(out.errors[0].message).toBe("Generation stopped after 2000 ms: template 'f' was still running");
        expect(out.errors[0].template).toBe('f');
        expect(out).toMatchObject({ code: '', map: [], hasErrors: true });
        expect(textLength(out.text)).toBe(0);
        // 2000 / 50 checkpoints and the clock's start, then the trip: not the 2^17 calls of the template.
        expect(clock.reads).toBe(42);
    });

    it('a fan-out with no hole stops at a call, placed at the start of the called template (mutant: call checkpoint removed)', () => {
        const out = run(
            [
                { name: 'main', params: ['n'], body: 'f(n)' },
                { name: 'f', params: ['n'], body: 'if n > 0 then f(n - 1) + f(n - 1) else "x"' },
            ],
            [16], { now: ticking(50).now },
        );
        expect(out.errors).toEqual([{ template: 'f', offset: 0, line: 1, column: 1, message: "Generation stopped after 2000 ms: template 'f' was still running" }]);
        expect(out.code).toBe('');
    });

    it('the same template under the bound generates in full (mutant: every checkpoint trips)', () => {
        const out = run(FAN_OUT, [3], { now: () => 0 });
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('x'.repeat(16));
    });
});

describe('the output budget', () => {
    const REPEAT: TemplateRecord[] = [{ name: 'main', params: ['n'], body: '${"a".repeat(n)}', mode: 'text' }];

    it('1,000,000 characters generate (mutant: the bound compared with >=)', () => {
        const out = run(REPEAT, [1_000_000]);
        expect(out.errors).toEqual([]);
        expect(out.code.length).toBe(1_000_000);
    });

    it('one more stops with one error and no code, the message of the discovery (mutant: output checkpoints removed)', () => {
        const out = run(REPEAT, [1_000_001]);
        expect(out.errors.map(e => e.message)).toEqual(['Generation stopped: the output passed 1,000,000 characters']);
        expect(out.code).toBe('');
        expect(out.map).toEqual([]);
    });

    it('a concatenation of two Texts under the bound each trips when the sum passes it', () => {
        const CONCAT: TemplateRecord[] = [{ name: 'main', params: ['s'], body: '"${s}" + "${s}"' }];
        expect(run(CONCAT, ['aaaaa'], { maxChars: 10 }).code).toBe('aaaaaaaaaa');
        const out = run(CONCAT, ['aaaaaa'], { maxChars: 10 });
        expect(out.errors.map(e => e.message)).toEqual(['Generation stopped: the output passed 10 characters']);
        expect(out.errors[0].template).toBe('main');
    });

    it('a Text carries the length of its fragments', () => {
        const t = makeText([fragment('ab', { kind: 'opaque', reads: [] }), fragment('\ncd', { kind: 'opaque', reads: [] })]);
        expect(textLength(t)).toBe(5);
        expect(textLength(EMPTY_TEXT)).toBe(0);
    });
});

describe('a tripped budget stays tripped', () => {
    it('every later checkpoint throws the same error, even with the clock back under the bound (mutant: not sticky)', () => {
        let t = 0;
        const budget = new GenerationBudget({ timeMs: 10, now: () => t });
        budget.checkpoint(AT);
        t = 11;
        let first: unknown;
        try { budget.checkpoint(AT); } catch (e) { first = e; }
        expect(first).toBeInstanceOf(Error);
        t = 0;
        expect(() => budget.checkpoint(AT)).toThrow(first as Error);
        expect(() => budget.measure(EMPTY_TEXT)).toThrow(first as Error);
        expect(budget.stop).toMatchObject({ ...AT, message: "Generation stopped after 10 ms: template 't' was still running" });
    });

    it("a hole's catch rethrows the stop instead of writing an error fragment (mutant: rethrow after the hole removed)", () => {
        const budget = new GenerationBudget({ maxChars: 3 });
        const host = new OriginHost({}, new TemplateSources(), budget);
        const big = makeText([fragment('aaaa', { kind: 'opaque', reads: [] })]);
        const hole = { type: 'Identifier', name: 'x' } as unknown as JjelExpression;
        expect(() => host.evaluateHole(hole, () => budget.measure(big) as unknown as JjelValue)).toThrow('the output passed 3 characters');
    });

    it('nothing after the hole that tripped is evaluated, and the generation reports that one error', () => {
        let ticks = 0;
        const tick = createFunction([], () => { ticks++; return 'T'; }) as unknown as JjelValue;
        const out = run(
            [
                { name: 'main', params: [], body: '${a()}${tick()}', mode: 'text' },
                { name: 'a', params: [], body: 'aaaa', mode: 'text' },
            ],
            [], { maxChars: 3 }, { tick },
        );
        expect(ticks).toBe(0);
        expect(out.errors.map(e => e.message)).toEqual(['Generation stopped: the output passed 3 characters']);
        expect(out.errors[0].template).toBe('a');
        expect(out.code).toBe('');
    });
});

describe.each(EXAMPLES)('the example %s under the default budget', name => {
    it('generates the code, map and errors it generates with no limit', () => {
        const gen = (limits: object) => {
            const ex = loadExample(name);
            const out = generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, readModelTemplates(ex.lookup, ex.modelId).templates, 'main', [], limits);
            return JSON.stringify({ code: out.code, map: out.map, errors: out.errors });
        };
        const bounded = gen({});
        expect(JSON.parse(bounded).errors).toEqual([]);
        expect(bounded).toBe(gen({ timeMs: Infinity, maxChars: Infinity }));
    });
});
