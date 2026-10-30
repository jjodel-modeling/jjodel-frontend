/**
 * Refactoring diagnostics (P-2026-10-24-2320): the plan's warnings and errors mapped to editor
 * lines, gutter dots and the columns of the names that do not resolve. Planned by the real
 * `planEffects` on a small metamodel world, so the messages are the planner's own.
 */
import { describe, it, expect } from 'vitest';
import { planEffects, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import { diagnosticsOf, findName, gutterLines, rangeLabel, unresolvedName } from '../refactoringDiagnostics';

const world: PlanWorld = {
    level: 'M2',
    classes: { Person: { name: 'Person', kinds: ['Person'], attributes: [{ name: 'age', upper: 1 }], references: [] } },
    elements: [],
    m2: {
        id: 'mm', name: 'MM', defaultParent: 'pkg',
        elements: [
            { id: 'pkg', name: 'p', kind: 'Package', father: 'mm' },
            { id: 'cPerson', name: 'Person', kind: 'Class', father: 'pkg', extends: [] },
            { id: 'aAge', name: 'age', kind: 'Attribute', father: 'cPerson', upper: 1 },
        ],
        slotValues: { aAge: [{ modelId: 'org', model: 'org', count: 12 }] },
    },
};

describe('diagnosticsOf', () => {
    it('underlines an unresolved superclass at its columns and lists the slot loss without a range', async () => {
        const script = 'create class Student extends Persn\ndelete attribute Person.age';
        const ds = diagnosticsOf(await planEffects(script, world), script);
        expect(ds.map((d) => [d.line, d.code, d.startColumn, d.endColumn])).toEqual([
            [1, 'PARENT_NOT_FOUND', 30, 35],
            [2, 'FEATURE_HAS_VALUES', undefined, undefined],
        ]);
        expect(ds.map(rangeLabel)).toEqual(['L1:30-34', 'L2']);
        expect(ds[1].message).toBe('org loses 12 slot values');
    });

    it('underlines the property, not the element, of «has no property»', async () => {
        const script = 'set Person.colour = "red"';
        const ds = diagnosticsOf(await planEffects(script, world), script);
        expect(ds).toHaveLength(1);
        expect(ds[0].code).toBe('UNKNOWN_PROPERTY');
        expect(script.slice(ds[0].startColumn! - 1, ds[0].endColumn! - 1)).toBe('colour');
    });

    it('keeps the script line numbers through blank and comment lines; errors after warnings', async () => {
        const script = '// header\n\ndelete class Nope\ncreate class';
        const ds = diagnosticsOf(await planEffects(script, world), script);
        expect(ds.map((d) => [d.line, d.severity, d.code])).toEqual([[3, 'warning', 'ELEMENT_NOT_FOUND'], [4, 'error', 'PARSE_ERROR']]);
        expect(rangeLabel(ds[0])).toBe('L3:14-17');
    });

    it('no plan, no diagnostics', () => {
        expect(diagnosticsOf(null, 'anything')).toEqual([]);
    });
});

describe('the pieces', () => {
    it('unresolvedName: only for unresolved-name codes', () => {
        expect(unresolvedName({ line: 1, code: 'CLASS_NOT_FOUND', message: "Class 'Foo' not found in metamodel" })).toBe('Foo');
        expect(unresolvedName({ line: 1, code: 'DUPLICATE_NAME', message: "'Foo' already exists" })).toBeNull();
        expect(unresolvedName({ line: 1, code: 'PARENT_NOT_FOUND', message: 'Could not find parent for attribute' })).toBeNull();
    });

    it('findName: a whole word only, a qualified name whole', () => {
        expect(findName('create class AB extends A', 'A')).toEqual({ startColumn: 25, endColumn: 26 });
        expect(findName('delete p::Person', 'p::Person')).toEqual({ startColumn: 8, endColumn: 17 });
        expect(findName('delete Persona', 'Person')).toBeNull();
        expect(findName('delete MyPerson', 'Person')).toBeNull();
    });

    it('gutterLines: one dot per line, the error wins', () => {
        expect(gutterLines([
            { line: 2, severity: 'warning', code: 'a', message: '' },
            { line: 2, severity: 'error', code: 'b', message: '' },
            { line: 2, severity: 'warning', code: 'c', message: '' },
            { line: 1, severity: 'warning', code: 'd', message: '' },
        ])).toEqual([{ line: 1, severity: 'warning' }, { line: 2, severity: 'error' }]);
    });
});
