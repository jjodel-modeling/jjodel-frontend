/**
 * irLabelEdit: which labels rename the element on the canvas (P-2026-10-01-2349).
 *
 * The predicate is shared by the compile (`CompiledLabel.editsName`) and the label editor's
 * Editable toggle, so the two cannot disagree. Executed on real input: the 5 sources times the
 * 4 values of `editable`, with the expected answer written out by hand and not recomputed from
 * the rule, then the compile of the same labels agreeing with it.
 */
import { describe, it, expect } from 'vitest';
import { labelCanRename, labelEditsName } from '../irLabelEdit';
import { compileView, clearCompileCache } from '../irCompile';
import type { LabelSpec, TextSource, VertexViewIR } from '../irTypes';

const SOURCES: Record<string, TextSource> = {
    path: { from: 'path', expr: '$name.value' },
    literal: { from: 'literal', text: 'fixed' },
    name: { from: 'intrinsic', prop: 'name' },
    qualifiedName: { from: 'intrinsic', prop: 'qualifiedName' },
    metaclassName: { from: 'intrinsic', prop: 'metaclassName' },
};

const EDITABLES: Record<string, Partial<Pick<LabelSpec, 'editable'>>> = {
    absent: {},
    on: { editable: true },
    off: { editable: false },
    widget: { editable: { widget: 'text' } },
};

/** The answer per source and per value of `editable`, by hand: only an intrinsic name or
 *  qualifiedName renames, and only unless `editable` is exactly false. */
const EXPECTED: Record<string, Record<string, boolean>> = {
    path:          { absent: false, on: false, off: false, widget: false },
    literal:       { absent: false, on: false, off: false, widget: false },
    name:          { absent: true,  on: true,  off: false, widget: true },
    qualifiedName: { absent: true,  on: true,  off: false, widget: true },
    metaclassName: { absent: false, on: false, off: false, widget: false },
};

const labelOf = (source: string, editable: string): LabelSpec =>
    ({ position: 'top', source: SOURCES[source], ...EDITABLES[editable] });

describe('labelCanRename: the sources that can edit the name', () => {
    it('is true for the intrinsic name; dropping the name case kills this test', () => {
        expect(labelCanRename(SOURCES.name)).toBe(true);
    });

    it('is true for the intrinsic qualifiedName; dropping the qualifiedName case kills this test', () => {
        expect(labelCanRename(SOURCES.qualifiedName)).toBe(true);
    });

    it('is false for the intrinsic metaclassName; accepting metaclassName kills this test', () => {
        expect(labelCanRename(SOURCES.metaclassName)).toBe(false);
    });

    it('is false for a literal and for a path; accepting any intrinsic or any source kills this test', () => {
        expect(labelCanRename(SOURCES.literal)).toBe(false);
        expect(labelCanRename(SOURCES.path)).toBe(false);
    });
});

describe('labelEditsName: the whole table', () => {
    for (const source of Object.keys(SOURCES)) {
        for (const editable of Object.keys(EDITABLES)) {
            it(`${source} with editable ${editable} is ${EXPECTED[source][editable]}`, () => {
                expect(labelEditsName(labelOf(source, editable))).toBe(EXPECTED[source][editable]);
            });
        }
    }

    it('an absent editable still renames: dropping the !== false and testing === true kills this test', () => {
        expect(labelEditsName(labelOf('name', 'absent'))).toBe(true);
    });

    it('an explicit false opts out: ignoring editable kills this test', () => {
        expect(labelEditsName(labelOf('name', 'off'))).toBe(false);
        expect(labelEditsName(labelOf('qualifiedName', 'off'))).toBe(false);
    });

    it('a persisted true keeps working', () => {
        expect(labelEditsName(labelOf('name', 'on'))).toBe(true);
    });
});

describe('the compile agrees with the predicate', () => {
    it('editsName of the compiled label is labelEditsName of the label, for all 20 combinations', () => {
        clearCompileCache();
        for (const source of Object.keys(SOURCES)) {
            for (const editable of Object.keys(EDITABLES)) {
                const label = labelOf(source, editable);
                const ir = {
                    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
                    shape: { form: 'rect', labels: [label] },
                } as VertexViewIR;
                const compiled = compileView(`v_edit_${source}_${editable}`, ir).labels[0];
                expect(compiled.editsName, `${source}/${editable}`).toBe(EXPECTED[source][editable]);
                expect(compiled.editsName, `${source}/${editable}`).toBe(labelEditsName(label));
            }
        }
    });
});
