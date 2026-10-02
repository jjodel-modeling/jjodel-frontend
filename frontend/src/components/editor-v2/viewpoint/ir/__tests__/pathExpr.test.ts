/**
 * Unit tests for the extracted PathExpr grammar (risk R8).
 *
 * parsePathExpr was private to irCompile.ts and reachable only through
 * compileView, so its contract was asserted only by reflection. These tests pin
 * it directly: the accepted forms, the six forbidden constructs, the thrown
 * messages (validateIR surfaces them verbatim in the authoring panel) and the
 * shape returned for the partial inputs the two authoring widgets can receive.
 */
import { describe, it, expect } from 'vitest';
import { FORBIDDEN_PATH, STEP_RE, parsePathExpr, presentationAttrOf, singleHopOf } from '../pathExpr';
import { parseExpressionStrict } from '../../../../../jjel/parser/parser';

describe('parsePathExpr — single hop', () => {
    it('parses a bare $feature as a .value take', () => {
        expect(parsePathExpr('$name')).toEqual({
            steps: [{ feature: 'name', take: 'value' }],
            featureNames: ['name'],
        });
    });

    it('parses an explicit .value', () => {
        expect(parsePathExpr('$name.value')).toEqual({
            steps: [{ feature: 'name', take: 'value' }],
            featureNames: ['name'],
        });
    });

    it('parses .values as a whole-array take', () => {
        expect(parsePathExpr('$tags.values')).toEqual({
            steps: [{ feature: 'tags', take: 'values' }],
            featureNames: ['tags'],
        });
    });

    it('parses .values[N] as a numeric take', () => {
        expect(parsePathExpr('$tags.values[3]')).toEqual({
            steps: [{ feature: 'tags', take: 3 }],
            featureNames: ['tags'],
        });
    });

    it('keeps index 0 distinct from the whole-array take', () => {
        expect(parsePathExpr('$tags.values[0]').steps[0].take).toBe(0);
        expect(parsePathExpr('$tags.values').steps[0].take).toBe('values');
    });
});

describe('parsePathExpr — multi hop', () => {
    it('chains hops and reports featureNames in traversal order', () => {
        expect(parsePathExpr('$owner.value.$name.value')).toEqual({
            steps: [
                { feature: 'owner', take: 'value' },
                { feature: 'name', take: 'value' },
            ],
            featureNames: ['owner', 'name'],
        });
    });

    it('carries the take of each hop independently', () => {
        const parsed = parsePathExpr('$members.values[2].$tags.values');
        expect(parsed.steps).toEqual([
            { feature: 'members', take: 2 },
            { feature: 'tags', take: 'values' },
        ]);
        expect(parsed.featureNames).toEqual(['members', 'tags']);
    });

    it('preserves featureNames order over three hops', () => {
        expect(parsePathExpr('$a.value.$b.value.$c.value').featureNames).toEqual(['a', 'b', 'c']);
    });
});

describe('parsePathExpr — forbidden constructs', () => {
    // One case per construct in FORBIDDEN_PATH: ?. ?? ? : ( )
    const forbidden = ['$a?.value', '$a ?? $b', '$a?', '$a:value', '$a(value)', '$a)value'];

    for (const expr of forbidden) {
        it(`rejects ${JSON.stringify(expr)}`, () => {
            expect(FORBIDDEN_PATH.test(expr)).toBe(true);
            expect(() => parsePathExpr(expr)).toThrow(/forbidden construct in PathExpr/);
        });
    }
});

describe('parsePathExpr — malformed input', () => {
    it('rejects a step that does not match STEP_RE', () => {
        expect(STEP_RE.test('garbage')).toBe(false);
        expect(() => parsePathExpr('$a.garbage')).toThrow(/invalid PathExpr step "garbage"/);
    });

    it('rejects a feature name that does not start with $', () => {
        expect(() => parsePathExpr('name.value')).toThrow(/invalid PathExpr step "name"/);
    });

    it('rejects a dangling .value', () => {
        expect(() => parsePathExpr('.value')).toThrow(/dangling \.value/);
    });

    it('rejects a dangling .values', () => {
        expect(() => parsePathExpr('.values')).toThrow(/dangling \.values/);
    });

    it('rejects the empty expression', () => {
        expect(() => parsePathExpr('')).toThrow(/empty PathExpr/);
    });
});

describe('parsePathExpr — partial input from the authoring widgets', () => {
    // The two widgets pass through whatever the IR holds. These pin which partial
    // forms throw and which parse, which is the contract singleHopOf converts.
    it('"$" alone is not a valid step', () => {
        expect(() => parsePathExpr('$')).toThrow(/invalid PathExpr step "\$"/);
    });

    it('a trailing dot is dropped, so "$f." parses as "$f"', () => {
        expect(parsePathExpr('$f.')).toEqual({
            steps: [{ feature: 'f', take: 'value' }],
            featureNames: ['f'],
        });
    });

    it('an unfinished take is an invalid step', () => {
        expect(() => parsePathExpr('$f.val')).toThrow(/invalid PathExpr step "val"/);
    });

    it('the empty string throws rather than returning an empty parse', () => {
        expect(() => parsePathExpr('')).toThrow();
    });
});

describe('singleHopOf', () => {
    it('returns the hop for each single-hop form', () => {
        expect(singleHopOf('$name')).toEqual({ feature: 'name', take: 'value' });
        expect(singleHopOf('$name.value')).toEqual({ feature: 'name', take: 'value' });
        expect(singleHopOf('$tags.values')).toEqual({ feature: 'tags', take: 'values' });
        expect(singleHopOf('$tags.values[4]')).toEqual({ feature: 'tags', take: 4 });
    });

    it('returns null on multi-hop, so authoring stays single-hop', () => {
        expect(singleHopOf('$owner.value.$name.value')).toBeNull();
        expect(singleHopOf('$a.value.$b.value.$c.value')).toBeNull();
    });

    it('returns null instead of throwing on every input parsePathExpr rejects', () => {
        for (const expr of ['', '$', '$f.val', '.value', '$a?.value', '$a(value)', 'name.value']) {
            expect(() => singleHopOf(expr)).not.toThrow();
            expect(singleHopOf(expr)).toBeNull();
        }
    });

    it('tolerates a null-ish expression', () => {
        expect(singleHopOf(undefined as unknown as string)).toBeNull();
    });
});

/**
 * `node.[x]` recognized by the JjEL parser itself (R-SIM-108, P-2026-10-03-0121): the corpus of the
 * discovery (`discovery_2026-10-02_sim_node_presentation.md` §2.1), where a regex built from
 * STATE_RESERVED disagreed with the parser on two inputs, `node.[ heat ]` and `node.[if]`.
 */
describe('presentationAttrOf — node.[x], as the engine reads it', () => {
    const CORPUS: [string, string | null][] = [
        ['node.[heat]', 'heat'],
        [' node.[heat] ', 'heat'],
        ['node .[heat]', 'heat'],
        ['node.[ heat ]', 'heat'],        // the regex said null: the parser accepts the spaces
        ['node. [heat]', null],           // `. [` is not the operator
        ['node.heat', null],
        ['node.[heat].x', null],
        ['node.[1x]', null],
        ['self.[visits]', null],          // a state root, not the presentation one
        ['model.[i]', null],
        ['node.[heat] ?? 0', null],
        ['node?.[heat]', null],
        ['$node.value', null],            // a feature called node stays a feature
        ['Node.[heat]', null],
        ['node.[marked]', 'marked'],
        ['node.[if]', null],              // the regex said `if`: a keyword is not an attribute
        ['node.[_x9]', '_x9'],
        ['node[heat]', null],
    ];

    it('answers the corpus as the JjEL parser does, input by input', () => {
        for (const [expr, attr] of CORPUS) expect([expr, presentationAttrOf(expr)]).toEqual([expr, attr]);
    });

    it('agrees with parseExpressionStrict on every input, by construction', () => {
        for (const [expr] of CORPUS) {
            const r = parseExpressionStrict(expr);
            const e: any = r.expression;
            const engine = e && r.errors.length === 0 && e.type === 'StateAccess' && e.object?.type === 'Identifier' && e.object.name === 'node'
                ? e.attribute : null;
            expect([expr, presentationAttrOf(expr)]).toEqual([expr, engine]);
        }
    });

    it('requires the end of the input, as the engine\'s strict parse does', () => {
        expect(presentationAttrOf('node.[heat] x')).toBeNull();
        expect(presentationAttrOf('node.[heat] node.[cold]')).toBeNull();
    });

    it('is null, never a throw, on every PathExpr and on what is not a string', () => {
        for (const expr of ['$name', '$name.value', '$tags.values[3]', '$owner.value.$name.value', '', '$', '.value', '$a?.value']) {
            expect(() => presentationAttrOf(expr)).not.toThrow();
            expect(presentationAttrOf(expr)).toBeNull();
        }
        expect(presentationAttrOf(undefined as unknown as string)).toBeNull();
    });

    it('leaves the PathExpr grammar closed: node.[x] still throws in parsePathExpr (R-J7, R-MK-1)', () => {
        expect(STEP_RE.test('node')).toBe(false);
        expect(() => parsePathExpr('node.[heat]')).toThrow('[ir] invalid PathExpr step "node" in node.[heat]');
        expect(singleHopOf('node.[heat]')).toBeNull();
    });
});
