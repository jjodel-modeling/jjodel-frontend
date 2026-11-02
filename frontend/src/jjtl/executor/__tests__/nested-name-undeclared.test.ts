import { describe, it, expect, vi } from 'vitest';

/**
 * Ticket #445 (jjodel-lanes), finding only (P-2026-11-02-1956): does a nested creation lose
 * `name` in the executor, or only in the write-back when its class declares no `name`?
 *
 * The executor keeps `name` on the created object whether or not the class declares it,
 * and says nothing. `nestedAttributesOf` (components/project/nestedMaterialization.ts:113)
 * writes only the attributes the class declares, and the leftover check exempts `name`
 * (line 210), so the value is lost there, silently. No fix here.
 *
 * `joiner` is mocked as in resolution-fallbacks.test.ts.
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

function cls(name: string, attributes: string[], references: any[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
    };
}

const TARGET = {
    classes: [
        cls('Box', ['name'], [{ name: 'kids', composition: true, type: { name: 'Kid' } }]),
        cls('Kid', ['weight']),
    ],
};

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('a nested creation of a class with no name attribute — %s', (_label, withSource) => {
    it('keeps name on the created object, without a warning', async () => {
        const text = 'transformation T\nfrom S\nto Tg\n\n' +
            'B -> Box {\n    name := name\n    -> kids {\n        -> Kid {\n            name := "k1"\n            weight := 3\n        }\n    }\n}';
        const { tokens } = new JjtlLexer(text).tokenize();
        const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
        expect(errors).toEqual([]);
        const result = await execute(ast!, [{ id: 'b1', name: 'b1', className: 'B', __type: 'B' }], TARGET);
        expect(result.errors).toEqual([]);
        const kid = result.targetModel!.instances.get('Box')![0].kids;
        expect(kid).toMatchObject({ __nested: true, className: 'Kid', name: 'k1', weight: 3 });
        expect(result.warnings.filter(w => /name/.test(w))).toEqual([]);
    });
});
