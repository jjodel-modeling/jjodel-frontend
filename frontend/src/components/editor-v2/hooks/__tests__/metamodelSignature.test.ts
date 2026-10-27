/**
 * metamodelSignature — the key of `useEditorMode`'s memo.
 *
 * The memo re-derives the M1 palette, the drop gate and the canvas menu only
 * when this string changes, so every field `resolveM1Info` reads must move it.
 * One test per field: the field changes, the signature changes. Measured on
 * 2026-10-11 (P-2026-10-11-1135) that a containment switched off under an open
 * model left its target out of the palette, because the string carried no
 * containment. The opposite holds too: a field the resolver does not read
 * (`pointedBy`, a vertex position) leaves it alone, or every write would
 * re-derive the canvas.
 *
 * The positive control opens the file: two equal inputs give one non-empty
 * string, so an «it changed» below is a change and not two empty strings.
 */

import { describe, expect, it } from 'vitest';
import { metamodelSignature } from '../metamodelSignature';

type L = Record<string, any>;

/** A metamodel M: package P (classes A, B) with subpackage SP (class C), and class Z directly on M. */
function base(): L {
    return {
        M: { id: 'M', className: 'DModel', isMetamodel: true, classes: ['Z'], packages: ['P'] },
        P: { id: 'P', className: 'DPackage', classes: ['A', 'B'], subpackages: ['SP'] },
        SP: { id: 'SP', className: 'DPackage', classes: ['C'], subpackages: [] },
        A: { id: 'A', className: 'DClass', name: 'A', abstract: false, interface: false, isSingleton: false,
            references: ['rA'], attributes: ['aA'], extends: [], pointedBy: [] },
        B: { id: 'B', className: 'DClass', name: 'B', abstract: false, interface: false, isSingleton: false,
            references: [], attributes: [], extends: [] },
        C: { id: 'C', className: 'DClass', name: 'C', abstract: false, interface: false, isSingleton: false,
            references: [], attributes: [], extends: [] },
        Z: { id: 'Z', className: 'DClass', name: 'Z', abstract: false, interface: false, isSingleton: false,
            references: [], attributes: [], extends: [] },
        rA: { id: 'rA', className: 'DReference', name: 'kids', type: 'B',
            composition: false, aggregation: false, lowerBound: 0, upperBound: -1, pointedBy: [] },
        aA: { id: 'aA', className: 'DAttribute', name: 'x', type: 'EString' },
    };
}

const sigOf = (mutate: (l: L) => void = () => {}): string => {
    const l = base();
    mutate(l);
    return metamodelSignature(l, 'M');
};

describe('metamodelSignature: the positive control', () => {
    it('two equal metamodels give one non-empty signature', () => {
        const s = sigOf();
        expect(s.length).toBeGreaterThan(0);
        expect(sigOf()).toBe(s);
    });

    it('no metamodel id or no record gives the empty string', () => {
        expect(metamodelSignature(base(), null)).toBe('');
        expect(metamodelSignature(base(), 'missing')).toBe('');
        expect(metamodelSignature(undefined, 'M')).toBe('');
    });
});

describe('metamodelSignature: what resolveM1Info reads moves it', () => {
    const before = sigOf();
    const cases: Array<[string, (l: L) => void]> = [
        // The fields added on 2026-10-11.
        ['a reference switched to containment', (l) => { l.rA.composition = true; }],
        ['a reference switched to aggregation', (l) => { l.rA.aggregation = true; }],
        ['a reference retargeted', (l) => { l.rA.type = 'C'; }],
        ['a reference lower bound', (l) => { l.rA.lowerBound = 1; }],
        ['a reference upper bound', (l) => { l.rA.upperBound = 1; }],
        ['a class made an interface', (l) => { l.B.interface = true; }],
        ['a supertype added', (l) => { l.B.extends = ['A']; }],
        // The fields the signature carried before.
        ['a class renamed', (l) => { l.B.name = 'B2'; }],
        ['a class made abstract', (l) => { l.B.abstract = true; }],
        ['a class made a singleton', (l) => { l.B.isSingleton = true; }],
        ['a reference renamed', (l) => { l.rA.name = 'children'; }],
        ['an attribute renamed', (l) => { l.aA.name = 'y'; }],
        ['a reference removed', (l) => { l.A.references = []; }],
        ['a class added to the package', (l) => { l.D = { ...l.B, id: 'D', name: 'D' }; l.P.classes = ['A', 'B', 'D']; }],
    ];
    for (const [what, mutate] of cases) {
        it(`changes when ${what}`, () => {
            expect(sigOf(mutate)).not.toBe(before);
        });
    }
});

describe('metamodelSignature: where the classes are collected', () => {
    it('reads a class in a subpackage', () => {
        expect(sigOf((l) => { l.C.interface = true; })).not.toBe(sigOf());
    });

    it('reads a class held directly by the metamodel', () => {
        expect(sigOf((l) => { l.Z.abstract = true; })).not.toBe(sigOf());
    });
});

describe('metamodelSignature: pointers held as objects', () => {
    // The resolver reads `ref.type?.id` and `sup?.id`: an object-shaped pointer must count by its id.
    const objectShaped = (l: L) => {
        l.A.references = [{ ...l.rA, type: { id: 'B' } }];
        l.C.extends = [{ id: 'A' }];
    };

    it('a reference target held as an object moves it when retargeted', () => {
        const s = sigOf(objectShaped);
        expect(sigOf((l) => { objectShaped(l); l.A.references[0].type = { id: 'C' }; })).not.toBe(s);
    });

    it('a supertype held as an object moves it when changed', () => {
        const s = sigOf(objectShaped);
        expect(sigOf((l) => { objectShaped(l); l.C.extends = [{ id: 'B' }]; })).not.toBe(s);
    });
});

describe('metamodelSignature: what the resolver does not read leaves it alone', () => {
    it('pointedBy on a class and on a reference', () => {
        expect(sigOf((l) => { l.A.pointedBy = ['someone']; l.rA.pointedBy = ['someone']; })).toBe(sigOf());
    });

    it('a field of the metamodel record that is not a container list', () => {
        expect(sigOf((l) => { l.M.name = 'renamed metamodel'; })).toBe(sigOf());
    });
});
