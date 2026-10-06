/**
 * R-JS-6 — the figures of the Run summary come from the model, before and after, never
 * from the commands.
 *
 * The accessors are the status bar's (`StatusBar.tsx:160-171`: `classes`, `enumerators`, and
 * per class `attributes`, `operations`, `references`), plus `literals` per enum, `abstract`
 * per class, and `packages` with their `subpackages`. Plain objects stand in for the L-layer
 * proxies, which expose the same names.
 */
import { describe, it, expect } from 'vitest';
import { metamodelFigures, projectFigures, changedModels, figuresEqual } from '../components/runFigures';

const cls = (name: string, extra: any = {}) =>
    ({ name, attributes: [], references: [], operations: [], abstract: false, ...extra });

function mm(id: string, contents: any = {}) {
    return {
        id, name: id, isMetamodel: true,
        classes: contents.classes ?? [], enumerators: contents.enumerators ?? [], packages: contents.packages ?? [],
    };
}

describe('metamodelFigures', () => {
    it('counts what the status bar counts, plus literals, abstract classes and packages', () => {
        const figures = metamodelFigures(mm('MM', {
            classes: [
                cls('Net', { attributes: [{}, {}], references: [{}], operations: [{}] }),
                cls('Node', { abstract: true, attributes: [{}] }),
                cls('Place', { references: [{}, {}] }),
            ],
            enumerators: [{ name: 'Kind', literals: [{}, {}, {}] }, { name: 'Empty', literals: [] }],
            packages: [{ name: 'root', subpackages: [{ name: 'a', subpackages: [{ name: 'b' }] }] }],
        }));
        expect(figures).toEqual({
            classes: 3, abstractClasses: 1, attributes: 3, references: 3, operations: 1,
            enumerations: 2, literals: 3, packages: 3,
        });
    });

    it('survives missing or non-array collections', () => {
        expect(metamodelFigures({ classes: null, enumerators: undefined, packages: 'x' })).toEqual({
            classes: 0, abstractClasses: 0, attributes: 0, references: 0, operations: 0,
            enumerations: 0, literals: 0, packages: 0,
        });
    });

    it('does not loop on a package cycle', () => {
        const a: any = { name: 'a', subpackages: [] };
        const b: any = { name: 'b', subpackages: [a] };
        a.subpackages.push(b);
        expect(metamodelFigures(mm('MM', { packages: [a] })).packages).toBe(2);
    });
});

describe('projectFigures', () => {
    it('reads every metamodel and every M1 model once, M1 as instances', () => {
        const A = mm('A', { classes: [cls('X')] });
        const B = mm('B');
        const m1 = { id: 'm1', name: 'model_1', isMetamodel: false, objects: [{}, {}] };
        const figures = projectFigures({ metamodels: [A, B], models: [A, m1] });
        expect(figures.map(f => [f.id, f.isMetamodel, f.metamodel?.classes ?? null, f.instances ?? null]))
            .toEqual([['A', true, 1, null], ['B', true, 0, null], ['m1', false, null, 2]]);
    });

    it('is empty without a project', () => {
        expect(projectFigures(null)).toEqual([]);
    });
});

describe('changedModels', () => {
    it('lists only the models whose figures changed, every row with before, after and delta', () => {
        const before = projectFigures({ metamodels: [mm('A', { classes: [cls('X')] }), mm('B')], models: [] });
        const after = projectFigures({ metamodels: [
            mm('A', { classes: [cls('X')] }),
            mm('B', { classes: [cls('N', { abstract: true, attributes: [{}] }), cls('P')] }),
        ], models: [] });
        const changes = changedModels(before, after);
        expect(changes.map(c => c.name)).toEqual(['B']);
        const rows = Object.fromEntries(changes[0].rows.map(r => [r.label, [r.before, r.after, r.delta]]));
        expect(rows).toEqual({
            classes: [0, 2, 2], attributes: [0, 1, 1], references: [0, 0, 0], operations: [0, 0, 0],
            enumerations: [0, 0, 0], literals: [0, 0, 0], packages: [0, 0, 0],
        });
        expect(changes[0].rows[0].abstract).toEqual({ before: 0, after: 1 });
    });

    it('counts a delete as a negative delta, the figures being read, not parsed', () => {
        const before = projectFigures({ metamodels: [mm('A', { classes: [cls('X'), cls('Y')] })], models: [] });
        const after = projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] });
        expect(changedModels(before, after)[0].rows[0]).toMatchObject({ label: 'classes', before: 2, after: 1, delta: -1 });
    });

    it('shows an M1 model as one instances row', () => {
        const m = (n: number) => ({ id: 'm1', name: 'model_1', isMetamodel: false, objects: new Array(n).fill({}) });
        const changes = changedModels(projectFigures({ metamodels: [], models: [m(1)] }), projectFigures({ metamodels: [], models: [m(3)] }));
        expect(changes[0].rows).toEqual([{ label: 'instances', before: 1, after: 3, delta: 2 }]);
    });

    it('reads a model that appears only after as starting from zero', () => {
        const changes = changedModels([], projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] }));
        expect(changes[0].rows[0]).toMatchObject({ before: 0, after: 1, delta: 1 });
    });

    it('is empty when nothing changed, or when either side is unknown', () => {
        const same = projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] });
        expect(changedModels(same, projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] }))).toEqual([]);
        expect(changedModels(null, same)).toEqual([]);
        expect(changedModels(same, null)).toEqual([]);
    });
});

describe('figuresEqual', () => {
    it('compares by value, so a re-read of an unchanged model does not re-render', () => {
        const a = projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] });
        const b = projectFigures({ metamodels: [mm('A', { classes: [cls('X')] })], models: [] });
        const c = projectFigures({ metamodels: [mm('A', { classes: [cls('X'), cls('Y')] })], models: [] });
        expect(figuresEqual(a, b)).toBe(true);
        expect(figuresEqual(a, c)).toBe(false);
        expect(figuresEqual(null, null)).toBe(true);
        expect(figuresEqual(a, null)).toBe(false);
    });
});
