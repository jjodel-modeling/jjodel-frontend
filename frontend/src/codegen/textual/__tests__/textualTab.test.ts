/**
 * The read-only Text tab's pure half (slice T2b, P-2026-11-02-0040): the globals `buildEvalContext` gives a JjGen
 * generator, read as T1's input (`textInputOf`), and the text and EBNF the tab shows (`textualView`). The globals are
 * written by hand in the shape eval.ts builds them (class shells with shared supertype shells, objects whose reference
 * slots hold the target handles). The imports that reach the store are mocked, as openTemplateEditor.test.ts does.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { TEXT_EDITOR_OPTIONS, textInputOf, textualView } from '../ui/TextualTab';
import { deriveBaseGrammar } from '../baseGrammar';
import { concreteGrammarEbnf, deriveConcreteGrammar } from '../concreteGrammar';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { TextMetamodel, TextObject } from '../metamodel';

const attr = (owner: string, name: string, type: string, many = false) =>
    ({ name, type, className: owner, multiValued: many, defaultValue: null, __type: 'Attribute' });
const ref = (owner: string, name: string, type: string, upper: number, containment = false) =>
    ({ name, type, containment, multiplicity: upper === -1 ? '*' : String(upper), upperBound: upper, lowerBound: 0, opposite: null, className: owner, __type: 'Reference' });
const shell = (name: string, o: { isAbstract?: boolean; isInterface?: boolean; supers?: any[]; attributes?: any[]; references?: any[] } = {}) => ({
    name, className: 'DClass', isAbstract: !!o.isAbstract, isInterface: !!o.isInterface,
    attributes: o.attributes ?? [], references: o.references ?? [], superTypes: o.supers ?? [], subTypes: [], instances: [], allInstances: [],
    __type: 'Class',
});

function garageGlobals(extra: any[] = []): Record<string, any> {
    const named = shell('Named', { isAbstract: true, attributes: [attr('Named', 'name', 'EString')] });
    const person = shell('Person', { supers: [named] });
    const car = shell('Car', { supers: [named], attributes: [attr('Car', 'mode', 'Mode'), attr('Car', 'tags', 'EString', true)], references: [ref('Car', 'owner', 'Person', 1)] });
    const garage = shell('Garage', {
        supers: [named],
        references: [ref('Garage', 'cars', 'Car', -1, true), ref('Garage', 'people', 'Person', -1, true), ref('Garage', 'favourites', 'Car', 2)],
    });
    const thing = shell('Thing', { isInterface: true });
    const obj = (id: string, cls: any, slots: Record<string, unknown>): any => ({ id, __type: 'Object', instanceOf: cls, instanceof: cls, parent: null, ...slots });
    const ann = obj('a', person, { name: 'ann' });
    const c1 = obj('c1', car, { name: 'c1', mode: 'Fast', tags: ['x', 'y'], owner: ann });
    const c2 = obj('c2', car, { name: 'c2', mode: null, tags: [], owner: null });
    const home = obj('g', garage, { name: 'home', cars: [c1, c2], people: [ann], favourites: [c2] });
    for (const o of [ann, c1, c2]) o.parent = home;
    const orphan = { id: 'o', __type: 'Object', name: 'lost', instanceOf: null, instanceof: null, parent: null };
    return {
        classes: [named, person, car, garage, thing],
        enumerations: [{ name: 'Mode', literals: [{ name: 'Fast', value: 0 }, { name: 'Slow', value: 1 }], literalCount: 2, __type: 'Enumeration' }],
        instances: [home, ann, c1, c2, orphan, ...extra.map(f => f({ named, car }))],
    };
}

const EXPECTED_MM: TextMetamodel = {
    classes: [
        { name: 'Named', isAbstract: true, supers: [], attributes: [{ name: 'name', type: 'EString', many: false }], references: [] },
        { name: 'Person', isAbstract: false, supers: ['Named'], attributes: [], references: [] },
        {
            name: 'Car', isAbstract: false, supers: ['Named'],
            attributes: [{ name: 'mode', type: 'Mode', many: false }, { name: 'tags', type: 'EString', many: true }],
            references: [{ name: 'owner', type: 'Person', containment: false, many: false }],
        },
        {
            name: 'Garage', isAbstract: false, supers: ['Named'], attributes: [],
            references: [
                { name: 'cars', type: 'Car', containment: true, many: true },
                { name: 'people', type: 'Person', containment: true, many: true },
                { name: 'favourites', type: 'Car', containment: false, many: true },
            ],
        },
        { name: 'Thing', isAbstract: true, supers: [], attributes: [], references: [] },
    ],
    enumerations: [{ name: 'Mode', literals: ['Fast', 'Slow'] }],
};

const EXPECTED_OBJECTS: TextObject[] = [
    { id: 'g', cls: 'Garage', slots: { name: 'home', cars: ['c1', 'c2'], people: ['a'], favourites: ['c2'] } },
    { id: 'a', cls: 'Person', slots: { name: 'ann' } },
    { id: 'c1', cls: 'Car', slots: { name: 'c1', mode: 'Fast', tags: ['x', 'y'], owner: 'a' } },
    { id: 'c2', cls: 'Car', slots: { name: 'c2', mode: null, tags: [], owner: null } },
];

describe('textInputOf', () => {
    it('reads the class shells as T1 classes (dies on supertype shells kept, an interface read as concrete, an upper bound of 2 read as single)', () => {
        expect(textInputOf(garageGlobals()).metamodel).toEqual(EXPECTED_MM);
    });

    it('reads the objects with reference slots as ids, in feature order, and skips an object with no class (dies on handles kept, the orphan kept)', () => {
        expect(textInputOf(garageGlobals()).objects).toEqual(EXPECTED_OBJECTS);
    });

    it('reads no globals as an empty input', () => {
        expect(textInputOf({})).toEqual({ metamodel: { classes: [], enumerations: [] }, objects: [] });
    });

    it('reads `ordered` off the lookup by the feature id, ordered unless it says false (T7 D-2; dies on the flag dropped, on false read as ordered)', () => {
        const g = garageGlobals();
        const [, , car, garage] = g.classes;
        car.attributes[1].id = 'A_tags';
        garage.references[0].id = 'R_cars';
        garage.references[1].id = 'R_people';
        const lookup = { A_tags: { id: 'A_tags', ordered: false }, R_cars: { id: 'R_cars', ordered: true }, R_people: { id: 'R_people' } };
        const mm = textInputOf(g, lookup).metamodel;
        const cls = (name: string) => mm.classes.find(c => c.name === name)!;
        expect(cls('Car').attributes!.find(a => a.name === 'tags')!.ordered).toBe(false);
        expect(cls('Garage').references!.find(r => r.name === 'cars')!.ordered).toBe(true);
        expect(cls('Garage').references!.find(r => r.name === 'people')!.ordered).toBe(true);
        // Without the lookup the pure layer reads no flag: every feature unordered (R-TXT-21 (5)).
        expect(textInputOf(g).metamodel).toEqual(EXPECTED_MM);
    });

    it('reads bounds and the GenModel documentation off the lookup, as the Ecore import stores them (step B1; dies on either dropped, on another source read as documentation)', () => {
        const g = garageGlobals();
        const [, , car, garage] = g.classes;
        car.id = 'C_car';
        car.attributes[1].id = 'A_tags';
        garage.references[2].id = 'R_favs';
        g.enumerations[0].id = 'E_mode';
        g.enumerations[0].literals[0].id = 'L_fast';
        const DOC = 'http://www.eclipse.org/emf/2002/GenModel/documentation=';
        const lookup: Record<string, any> = {
            C_car: { id: 'C_car', annotations: ['n1', 'n2'] }, n1: { source: 'http://example.org/other=no' }, n2: { source: `${DOC}A car, with = in it.` },
            A_tags: { id: 'A_tags', lowerBound: 1, upperBound: -1, annotations: [] },
            R_favs: { id: 'R_favs', lowerBound: 0, upperBound: 2, annotations: ['n3'] }, n3: { source: `${DOC}The best ones.` },
            E_mode: { id: 'E_mode', annotations: ['n4'] }, n4: { source: `${DOC}How it drives.` },
            L_fast: { id: 'L_fast', annotations: ['n5'] }, n5: { source: `${DOC}Quick.` },
        };
        const mm = textInputOf(g, lookup).metamodel;
        const cls = (name: string) => mm.classes.find(c => c.name === name)!;
        expect(cls('Car').doc).toBe('A car, with = in it.');
        expect(cls('Car').attributes!.find(a => a.name === 'tags')).toMatchObject({ lower: 1, upper: -1 });
        expect(cls('Car').attributes!.find(a => a.name === 'tags')!.doc).toBeUndefined();
        expect(cls('Garage').references!.find(r => r.name === 'favourites')).toMatchObject({ lower: 0, upper: 2, doc: 'The best ones.' });
        expect(cls('Garage').doc).toBeUndefined();
        expect(mm.enumerations[0]).toEqual({ name: 'Mode', literals: ['Fast', 'Slow'], doc: 'How it drives.', literalDocs: { Fast: 'Quick.' } });
        expect(textInputOf(g).metamodel).toEqual(EXPECTED_MM);
    });
});

describe('textualView', () => {
    const grammar = deriveConcreteGrammar(deriveBaseGrammar(EXPECTED_MM), CLIKE_STYLE);

    it('is the text T1 prints for the model, and the concrete EBNF', () => {
        const view = textualView(garageGlobals());
        expect(view.error).toBeNull();
        expect(view.text).toBe(printTextModel(grammar, EXPECTED_OBJECTS).text);
        expect(view.text).toContain('home');
        expect(view.ebnf).toBe(concreteGrammarEbnf(grammar));
        expect(view.ebnf).toContain('::=');
    });

    it('reports a model it cannot print instead of throwing (dies when the printer error escapes)', () => {
        const stray = ({ named }: any) => ({ id: 'n', __type: 'Object', name: 'stray', instanceOf: named, instanceof: named, parent: null });
        const view = textualView(garageGlobals([stray]));
        expect(view.text).toBe('');
        expect(view.error).toMatch(/Named/);
        expect(view.ebnf).toBe(concreteGrammarEbnf(grammar));
    });
});

describe('TEXT_EDITOR_OPTIONS', () => {
    // Monaco's margin, measured in the app (P-2026-11-04-0146): glyph margin 20 px when on, folding 16 px when on, plus
    // lineDecorationsWidth. The global rules of skeleton.scss paint the text at 30 px whatever Monaco computes, so a wider
    // layout makes the first characters of a line hit the folding gutter and hides the chevrons under the text.
    it('keeps folding and lays the text out at the 30 px the global rules paint it (dies when the glyph margin comes back)', () => {
        const o = TEXT_EDITOR_OPTIONS;
        expect(o.folding).toBe(true);
        expect((o.glyphMargin ? 20 : 0) + o.lineDecorationsWidth + (o.folding ? 16 : 0)).toBe(30);
    });
});
