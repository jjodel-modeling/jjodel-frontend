import { describe, it, expect, vi } from 'vitest';

/**
 * The source models of a run (R-JTG-27, R-JTG-31, slice S4): what reaches the
 * executor and what the record keeps. ProjectEditor does not import in this bench
 * (`window is not defined`), so the two seams it calls are tested here, the
 * argument against the real executor.
 *
 * The `joiner` barrel is mocked as in multi-model-source.test.ts.
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
import { execute } from '../../executor/executor';
import type { TransformationAST } from '../../types/ast';
import {
    buildRunRecord,
    buildSourceArgument,
    latestRunOf,
    orderIncludedIds,
    restoredSources,
} from '../sourceSelection';

function parse(code: string): TransformationAST {
    const { tokens } = new JjtlLexer(code).tokenize();
    return new JjtlParser(tokens).parse().ast as TransformationAST;
}

const attrs = [{ name: 'name' }];
const TARGET = {
    classes: [{
        className: 'DClass', name: 'Table',
        attributes: attrs, allAttributes: attrs, references: [], allReferences: [],
    }],
};
const AST_CODE = `transformation T

from S
to R

Class c -> Table {
    name := c.name
}
`;

const obj = (id: string, name: string) => ({ id, name, className: 'Class', __type: 'Class' });
const namesOf = (result: any): string[] =>
    (result.targetModel.instances.get('Table') ?? []).map((t: any) => t.name ?? t.attributes?.name).sort();

describe('orderIncludedIds', () => {
    it('follows the list, whatever the order of the clicks', () => {
        expect(orderIncludedIds(['a', 'b', 'c'], ['c', 'b'], 'a')).toEqual(['b', 'c']);
    });

    it('never holds the primary', () => {
        expect(orderIncludedIds(['a', 'b'], ['a', 'b'], 'a')).toEqual(['b']);
    });

    it('drops an id no longer in the list', () => {
        expect(orderIncludedIds(['a', 'b'], ['b', 'gone'], 'a')).toEqual(['b']);
    });
});

describe('buildSourceArgument', () => {
    it('with nothing included is the very array of the primary', () => {
        const primary = [obj('1', 'A')];
        expect(buildSourceArgument(primary, [])).toBe(primary);
    });

    it('with included models is the list, primary first', () => {
        const a = [obj('1', 'A')];
        const b = [obj('2', 'B')];
        expect(buildSourceArgument(a, [b])).toEqual([a, b]);
    });

    it('the list reaches the executor and the objects of the included model are mapped', async () => {
        const result: any = await execute(
            parse(AST_CODE),
            buildSourceArgument([obj('1', 'A')], [[obj('2', 'B')]]),
            TARGET
        );
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
        expect(namesOf(result)).toEqual(['A', 'B']);
    });

    it('an included model with no objects keeps the list a list', async () => {
        const argument = buildSourceArgument([obj('1', 'A')], [[]]);
        expect(argument).toEqual([[obj('1', 'A')], []]);
        const result: any = await execute(parse(AST_CODE), argument, TARGET);
        expect(result.success).toBe(true);
        expect(namesOf(result)).toEqual(['A']);
    });

    it('a shared id fails the run with the error of S3', async () => {
        const result: any = await execute(
            parse(AST_CODE),
            buildSourceArgument([obj('1', 'A')], [[obj('1', 'B')]]),
            TARGET
        );
        expect(result.success).toBe(false);
        expect(result.errors.join('\n')).toContain('The source models share 1 id');
    });
});

describe('buildRunRecord', () => {
    it('with nothing included equals the record of today, without the key', () => {
        const record = buildRunRecord('t', 'a', [], 5);
        expect(record).toEqual({ transformationId: 't', sourceModelId: 'a', timestamp: 5 });
        expect('includedModelIds' in record).toBe(false);
    });

    it('keeps the included ids', () => {
        expect(buildRunRecord('t', 'a', ['b'], 5).includedModelIds).toEqual(['b']);
    });
});

describe('latestRunOf', () => {
    const older = buildRunRecord('t', 'a', [], 1);
    const newer = buildRunRecord('t', 'b', [], 2);

    it('takes the most recent record of the transformation', () => {
        expect(latestRunOf([newer, older], 't')).toBe(newer);
        expect(latestRunOf([older, newer], 't')).toBe(newer);
    });

    it('ignores other transformations and models with no record', () => {
        expect(latestRunOf([undefined, null, buildRunRecord('other', 'a', [], 9), older], 't')).toBe(older);
    });

    it('is null when the transformation never ran', () => {
        expect(latestRunOf([undefined, older], 'never')).toBeNull();
    });
});

describe('restoredSources', () => {
    it('reads back the primary and the included models', () => {
        expect(restoredSources(buildRunRecord('t', 'b', ['c'], 1), ['a', 'b', 'c']))
            .toEqual({ primaryId: 'b', includedIds: ['c'] });
    });

    it('an older record, without the field, leaves the dialog as it is', () => {
        expect(restoredSources({ transformationId: 't', sourceModelId: 'b', timestamp: 1 }, ['a', 'b'])).toBeNull();
    });

    it('a run with nothing included leaves the dialog as it is', () => {
        expect(restoredSources(buildRunRecord('t', 'b', [], 1), ['a', 'b'])).toBeNull();
    });

    it('no record leaves the dialog as it is', () => {
        expect(restoredSources(null, ['a', 'b'])).toBeNull();
        expect(restoredSources(undefined, ['a', 'b'])).toBeNull();
    });

    it('a primary no longer compatible leaves the dialog as it is', () => {
        expect(restoredSources(buildRunRecord('t', 'gone', ['b'], 1), ['a', 'b'])).toBeNull();
    });

    it('keeps only the included models that still exist', () => {
        expect(restoredSources(buildRunRecord('t', 'a', ['gone', 'b'], 1), ['a', 'b']))
            .toEqual({ primaryId: 'a', includedIds: ['b'] });
    });

    it('with no included model left leaves the dialog as it is', () => {
        expect(restoredSources(buildRunRecord('t', 'a', ['gone'], 1), ['a', 'b'])).toBeNull();
    });
});
