/**
 * The textual notation's test corpus, one copy for every test of the notation (R-TXT-25 (11)): T1's specs, the
 * lower-case style, and the grammar of a spec under a style. The 1709 fixture stays in spec.ts, next to the builder.
 */

import { deriveBaseGrammar } from '../baseGrammar';
import { deriveConcreteGrammar } from '../concreteGrammar';
import type { ConcreteGrammar } from '../concreteGrammar';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { metamodelOf } from './spec';
import type { Spec } from './spec';

export const grammarOf = (spec: Spec, style: NotationStyle = CLIKE_STYLE): ConcreteGrammar => deriveConcreteGrammar(deriveBaseGrammar(metamodelOf(spec)), style);

export const LOWER: NotationStyle = { ...CLIKE_STYLE, id: 'c-like-lower', classCase: 'lower', literalCase: 'lower' };

// R-TXT-1 on a diamond: A once, before both heirs, which keep their declaration order.
export const DIAMOND: Spec = {
    classes: [
        { name: 'A', isAbstract: true, attributes: [{ name: 'a', type: 'EInt' }], references: [{ name: 'ra', type: 'C' }] },
        { name: 'B1', isAbstract: true, supers: ['A'], attributes: [{ name: 'b1', type: 'EInt' }] },
        { name: 'B2', isAbstract: true, supers: ['A'], attributes: [{ name: 'b2', type: 'EInt' }] },
        { name: 'C', supers: ['B1', 'B2'], attributes: [{ name: 'c', type: 'EInt' }], references: [{ name: 'rc', type: 'C' }] },
    ],
    enums: {},
    objects: [{ id: 'x', cls: 'C', slots: { a: 1, b1: 2, b2: 3, c: 4, ra: 'x', rc: 'x' } }],
};

// R-TXT-12 without a shared ancestor, where the number of ancestors and the depth disagree: P has two (depth 1), S one
// (depth 1), R two (depth 2). By number: Q1 Q2 T S P R. By depth, as the probe sorted: Q1 Q2 T P S R.
export const NON_DIAMOND: Spec = {
    classes: [
        { name: 'Q1', isAbstract: true, attributes: [{ name: 'q1', type: 'EInt' }] },
        { name: 'Q2', isAbstract: true, attributes: [{ name: 'q2', type: 'EInt' }] },
        { name: 'T', isAbstract: true, attributes: [{ name: 't', type: 'EInt' }] },
        { name: 'S', isAbstract: true, supers: ['T'], attributes: [{ name: 's', type: 'EInt' }] },
        { name: 'P', isAbstract: true, supers: ['Q1', 'Q2'], attributes: [{ name: 'p', type: 'EInt' }] },
        { name: 'R', isAbstract: true, supers: ['S'], attributes: [{ name: 'r', type: 'EInt' }] },
        { name: 'C', supers: ['P', 'R'], attributes: [{ name: 'c', type: 'EInt' }] },
    ],
    enums: {},
    objects: [{ id: 'x', cls: 'C', slots: { q1: 1, q2: 2, t: 3, s: 4, p: 5, r: 6, c: 7 } }],
};

// Names, paths and roots: homonyms in one container and across containers, a homonym of another class, an abstract
// containment (a choice), a name unique only within the reference's type (`wheel v`, a Bolt is also `v`), a single
// containment, a nameless root, escapes, floats and many-valued attributes.
export const GARAGE: Spec = {
    classes: [
        { name: 'Item', isAbstract: true, attributes: [{ name: 'name', type: 'EString' }] },
        {
            name: 'Car', supers: ['Item'],
            attributes: [{ name: 'speed', type: 'EDouble' }, { name: 'colors', type: 'Color', many: true }, { name: 'marks', type: 'EInt', many: true }],
            references: [
                { name: 'engine', type: 'Engine', containment: true }, { name: 'wheels', type: 'Wheel', containment: true, many: true },
                { name: 'spare', type: 'Item', containment: true, many: true },
                { name: 'best', type: 'Item' }, { name: 'tow', type: 'Car' }, { name: 'eng', type: 'Engine' },
            ],
        },
        { name: 'Wheel', supers: ['Item'], attributes: [{ name: 'size', type: 'EInt' }], references: [{ name: 'bolts', type: 'Bolt', containment: true, many: true }, { name: 'pair', type: 'Bolt' }] },
        { name: 'Engine', attributes: [{ name: 'power', type: 'EInt' }, { name: 'note', type: 'EString' }] },
        { name: 'Bolt', attributes: [{ name: 'name', type: 'EString' }] },
        { name: 'Gear', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'wheel', type: 'Wheel' }] },
    ],
    enums: { Color: ['Red', 'GREEN', 'blue'] },
    objects: [
        { id: 'c1', cls: 'Car', slots: { name: 'alpha', speed: 1.5, colors: ['Red', 'blue'], marks: [3, 1], engine: 'e1', wheels: ['w1', 'w2'], spare: ['w3', 'c3'], best: 'w1', tow: 'c2', eng: 'e1' } },
        { id: 'c2', cls: 'Car', slots: { name: 'beta', wheels: ['w4'], best: 'w2', eng: 'e0', tow: 'c3' } },
        { id: 'g1', cls: 'Gear', slots: { name: 'w', wheel: 'w4' } },
        { id: 'e0', cls: 'Engine', slots: { power: 0 } },
        { id: 'e1', cls: 'Engine', slots: { power: 90, note: 'line1\nline2 "q"' } },
        { id: 'w1', cls: 'Wheel', slots: { name: 'w', size: 16, bolts: ['b1', 'b2'] } },
        { id: 'w2', cls: 'Wheel', slots: { name: 'w', size: 17 } },
        { id: 'w3', cls: 'Wheel', slots: { name: 'it\'s "odd"', size: 1 } },
        { id: 'c3', cls: 'Car', slots: { name: 'inner', tow: 'c1' } },
        { id: 'b1', cls: 'Bolt', slots: { name: 'b' } },
        { id: 'b2', cls: 'Bolt', slots: { name: 'b' } },
        { id: 'w4', cls: 'Wheel', slots: { name: 'v', bolts: ['b3'], pair: 'b1' } },
        { id: 'b3', cls: 'Bolt', slots: { name: 'v' } },
    ],
};

// A single nameless root: referenced it prints `Box[0]`; a named class with its name unset prints no name.
export const BOX: Spec = {
    classes: [
        {
            name: 'Box',
            references: [{ name: 'inner', type: 'Box', containment: true }, { name: 'label', type: 'Tag', containment: true }, { name: 'self', type: 'Box' }, { name: 'tag', type: 'Tag' }],
        },
        { name: 'Tag', attributes: [{ name: 'name', type: 'EString' }] },
    ],
    enums: {},
    objects: [
        { id: 'r', cls: 'Box', slots: { inner: 'i', self: 'r', tag: 't' } },
        { id: 'i', cls: 'Box', slots: { self: 'i', inner: 't2', label: 't' } },
        { id: 't', cls: 'Tag', slots: {} },
        { id: 't2', cls: 'Box', slots: {} },
    ],
};

// Class keywords that one case folding merges.
export const CASES: Spec = {
    classes: [{ name: 'Node', attributes: [{ name: 'name', type: 'EString' }] }, { name: 'NODE', attributes: [{ name: 'name', type: 'EString' }] }],
    enums: {},
    objects: [{ id: 'a', cls: 'Node', slots: { name: 'a' } }, { id: 'b', cls: 'NODE', slots: { name: 'b' } }],
};

// T2a's ticket (R-TXT-25 (5, 6)): the single containment `inner` of the only root and an object named `inner`, both
// targets of one reference. The path is `Room[0].inner[0]`, the name `inner`: they no longer print the same.
export const INNER: Spec = {
    classes: [
        {
            name: 'Room', attributes: [{ name: 'name', type: 'EString' }],
            references: [{ name: 'inner', type: 'Room', containment: true }, { name: 'rooms', type: 'Room', containment: true, many: true }, { name: 'see', type: 'Room', many: true }],
        },
    ],
    enums: {},
    objects: [
        { id: 'h', cls: 'Room', slots: { name: 'hall', inner: 'u', rooms: ['k'], see: ['u', 'k', 'h'] } },
        { id: 'u', cls: 'Room', slots: {} },
        { id: 'k', cls: 'Room', slots: { name: 'inner' } },
    ],
};
