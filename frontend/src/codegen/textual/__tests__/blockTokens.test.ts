/**
 * Block tokens per element, lane B1 (P-2026-11-05-1541; docs/discovery/discovery_2026-11-05_textual_block_tokens.md §1,
 * §2, §5, R-TXT-51, R-TXT-52 D2 D4 D5 D6 D8 D9 D10): optional `blockOpen` and `blockClose` on a class and on a
 * containment, over the language-wide tokens of the style. The resolution validates them; the derivation applies them to
 * the element's blocks, refuses them where there is no block, and reserves their words; the tokenizer reads their
 * punctuation; the style check reads them per block. The target text of R-TXT-51 prints, parses and prints the same.
 * Mutations each test kills are in its name; the bench is in the commit bodies.
 */

import { describe, expect, it } from 'vitest';
import { resolveAnnotations } from '../annotations';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel } from '../metamodel';

/** The probe's metamodel (report §4.4): a nameless Program holding declarations and statements, both named. */
const MM: TextMetamodel = {
    classes: [
        { name: 'Program', references: [{ name: 'declarations', type: 'Declaration', containment: true, many: true }, { name: 'statements', type: 'Statement', containment: true, many: true }] },
        { name: 'Declaration', attributes: [{ name: 'name', type: 'EString', lower: 1 }, { name: 'type', type: 'EString' }] },
        { name: 'Statement', attributes: [{ name: 'name', type: 'EString', lower: 1 }, { name: 'value', type: 'EInt' }] },
    ],
    enumerations: [],
};
const IDS: ElementIds = {
    classes: { cP: 'Program', cD: 'Declaration', cS: 'Statement' },
    features: {
        fDecls: { owner: 'Program', name: 'declarations' }, fStmts: { owner: 'Program', name: 'statements' },
        fDN: { owner: 'Declaration', name: 'name', lower: 1 }, fDT: { owner: 'Declaration', name: 'type' },
        fSN: { owner: 'Statement', name: 'name', lower: 1 }, fSV: { owner: 'Statement', name: 'value' },
    },
    enums: {},
};

/** The record of R-TXT-51's target: Pascal, Program positional and opened by `begin program`, declarations `is ... end`. */
const TARGET: SyntaxAnnotations = {
    v: 1, style: { base: 'pascal' }, roots: 'uncontained',
    classes: { cP: { keyword: '', blockOpen: ['begin', 'program'], blockClose: ['end', 'program'] }, cD: { layout: 'line' }, cS: { layout: 'line' } },
    features: { fDecls: { keyword: 'declaration', blockOpen: ['is'], blockClose: ['end'] }, fStmts: { keyword: 'statement' } },
};

/** The record with entries merged over TARGET's, by element id. */
const withEntries = (classes: Record<string, unknown>, features: Record<string, unknown> = {}, style?: Record<string, unknown>): SyntaxAnnotations => ({
    ...TARGET,
    ...(style ? { style } : {}),
    classes: { ...TARGET.classes, ...classes },
    features: { ...TARGET.features, ...features },
} as SyntaxAnnotations);

const resolved = (record: SyntaxAnnotations) => resolveAnnotations(record, IDS, MM);

describe('(1) the resolution of the per-block tokens', () => {
    it('keeps well-formed tokens on a class and on a feature, with no issue (mutant: a side not read)', () => {
        const r = resolved(TARGET);
        expect(r.issues).toEqual([]);
        expect(r.classes.Program).toEqual({ keyword: '', blockOpen: ['begin', 'program'], blockClose: ['end', 'program'] });
        expect(r.features['Program.declarations']).toEqual({ keyword: 'declaration', blockOpen: ['is'], blockClose: ['end'] });
        const p = resolved(withEntries({}, { fDecls: { blockOpen: ['<<'], blockClose: ['>>'] } }));
        expect(p.features['Program.declarations']).toEqual({ blockOpen: ['<<'], blockClose: ['>>'] });
    });

    it('drops a side that is not a list of well-formed tokens, with an error at the element; the other side stays (mutant: styleTokenFault not applied)', () => {
        const cases: [Record<string, unknown>, Record<string, unknown>, string, RegExp][] = [
            [{ cP: { blockOpen: 'begin', blockClose: ['end'] } }, {}, 'class Program', /blockOpen is not a list of tokens/],
            [{ cP: { blockOpen: ['begin'], blockClose: ['end', 'a b'] } }, {}, 'class Program', /the blockClose token "a b" holds a blank/],
            [{}, { fDecls: { blockOpen: ['is', ''], blockClose: ['end'] } }, 'Program.declarations', /the blockOpen token "" is empty/],
            [{}, { fDecls: { blockOpen: ['is'], blockClose: ['"'] } }, 'Program.declarations', /quote/],
            [{}, { fDecls: { blockOpen: ['@'], blockClose: ['end'] } }, 'Program.declarations', /neither a word nor a run of punctuation/],
            [{}, { fDecls: { blockOpen: ['is'], blockClose: [3] } }, 'Program.declarations', /is not a string/],
        ];
        for (const [classes, features, where, reason] of cases) {
            const r = resolved(withEntries(classes, features));
            const errors = r.issues.filter(i => i.level === 'error');
            expect(errors.map(i => i.where), JSON.stringify([classes, features])).toEqual([where]);
            expect(errors[0].message).toMatch(reason);
            const kept = where === 'class Program' ? r.classes.Program : r.features['Program.declarations'];
            const bad = /blockOpen/.test(errors[0].message) ? 'blockOpen' : 'blockClose';
            const good = bad === 'blockOpen' ? 'blockClose' : 'blockOpen';
            expect(kept[bad]).toBeUndefined();
            expect(kept[good]).toBeDefined();
        }
    });

    it('D6: an unknown key of a class or a feature entry is a notice, the known keys applied (mutant: unknown keys dropped silently)', () => {
        const r = resolved(withEntries({ cP: { keyword: '', prefix: ['begin'] } }, { fDecls: { keyword: 'declaration', blockopen: ['is'] } }));
        expect(r.issues).toEqual([
            { level: 'notice', where: 'class Program', message: 'unknown key "prefix": not applied' },
            { level: 'notice', where: 'Program.declarations', message: 'unknown key "blockopen": not applied' },
        ]);
        expect(r.classes.Program).toEqual({ keyword: '' });
        expect(r.features['Program.declarations']).toEqual({ keyword: 'declaration' });
    });

    it('an empty side resolves: whether it applies depends on the layout, the derivation\'s (mutant: an empty list refused by the resolution)', () => {
        const r = resolved(withEntries({ cP: { keyword: '', blockOpen: [] } }));
        expect(r.issues).toEqual([]);
        expect(r.classes.Program.blockOpen).toEqual([]);
    });
});
