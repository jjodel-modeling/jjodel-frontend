/**
 * irLabelEdit: which labels rename the element on the canvas (P-2026-10-01-2349).
 *
 * The predicate is shared by the compile (`CompiledLabel.editsName`) and the label editor's
 * Editable toggle, so the two cannot disagree. Executed on real input: the 5 sources times the
 * 4 values of `editable`, with the expected answer written out by hand and not recomputed from
 * the rule, then the compile of the same labels agreeing with it.
 */
import { describe, it, expect } from 'vitest';
import {
    labelCanRename, labelEditsName, labelEditableDefault, labelPathFeature, labelEditsFeature,
    labelFeatureEditBlock, labelEditBlock, labelEditable, labelFeatureInfoOf,
    type LabelEditBlock, type LabelFeatureInfo,
} from '../irLabelEdit';
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

/**
 * A path label edits one attribute of its own object (R-IRN-41, P-2026-10-02-1647). Opt-in: absent
 * stays not editable, so no derived view changes. The IR decides the step shape (`editsFeature`);
 * the slot's kind, type and multiplicity are checked where the metamodel is known, by one function
 * the panel and the canvas both call. Expected answers written by hand, not recomputed from the rule.
 */
const PATHS: Record<string, TextSource> = {
    oneStep: { from: 'path', expr: '$title.value' },
    bare: { from: 'path', expr: '$title' },
    multiStep: { from: 'path', expr: '$owner.value.$name.value' },
    values: { from: 'path', expr: '$title.values' },
    valuesAt: { from: 'path', expr: '$title.values[0]' },
};

const INFOS: Record<string, LabelFeatureInfo | null> = {
    stringAttr: { kind: 'attribute', type: 'EString', upperBound: 1 },
    multiValued: { kind: 'attribute', type: 'EString', upperBound: -1 },
    reference: { kind: 'reference', type: 'Person', upperBound: 1 },
    intAttr: { kind: 'attribute', type: 'EInt', upperBound: 1 },
    boolAttr: { kind: 'attribute', type: 'EBoolean', upperBound: 1 },
    unknown: null,
};

const pathLabel = (path: string, editable: string): LabelSpec =>
    ({ position: 'center', source: PATHS[path], ...EDITABLES[editable] });

describe('labelEditableDefault: what an absent editable means, per source', () => {
    it('a path label is not editable by default; a default of true for paths kills this test', () => {
        expect(labelEditableDefault(PATHS.oneStep)).toBe(false);
    });

    it('every other source keeps absent = editable (R-IRN-38); a default of false everywhere kills this test', () => {
        for (const key of ['literal', 'name', 'qualifiedName', 'metaclassName']) {
            expect(labelEditableDefault(SOURCES[key]), key).toBe(true);
        }
    });
});

describe('labelPathFeature: the one-step feature a path label reads', () => {
    it('is the feature of $f.value and of the bare $f', () => {
        expect(labelPathFeature(PATHS.oneStep)).toBe('title');
        expect(labelPathFeature(PATHS.bare)).toBe('title');
    });

    it('is null for a multi-step path; accepting any parsed path kills this test', () => {
        expect(labelPathFeature(PATHS.multiStep)).toBeNull();
    });

    it('is null for .values and .values[N]; ignoring the take kills this test', () => {
        expect(labelPathFeature(PATHS.values)).toBeNull();
        expect(labelPathFeature(PATHS.valuesAt)).toBeNull();
    });

    it('is null for every non-path source and for an unparsable path', () => {
        for (const key of ['literal', 'name', 'qualifiedName', 'metaclassName']) {
            expect(labelPathFeature(SOURCES[key]), key).toBeNull();
        }
        expect(labelPathFeature({ from: 'path', expr: '' })).toBeNull();
        expect(labelPathFeature({ from: 'path', expr: '$a ?? b' })).toBeNull();
    });
});

describe('labelEditsFeature: the IR half, decided at compile time', () => {
    const EXPECTED_FEATURE: Record<string, Record<string, string | null>> = {
        oneStep:   { absent: null, on: 'title', off: null, widget: 'title' },
        bare:      { absent: null, on: 'title', off: null, widget: 'title' },
        multiStep: { absent: null, on: null,    off: null, widget: null },
        values:    { absent: null, on: null,    off: null, widget: null },
        valuesAt:  { absent: null, on: null,    off: null, widget: null },
    };
    for (const path of Object.keys(PATHS)) {
        for (const editable of Object.keys(EDITABLES)) {
            it(`${path} with editable ${editable} is ${EXPECTED_FEATURE[path][editable]}`, () => {
                expect(labelEditsFeature(pathLabel(path, editable))).toBe(EXPECTED_FEATURE[path][editable]);
            });
        }
    }

    it('absent is not an opt-in: treating absent as true (the name-label rule) kills this test', () => {
        expect(labelEditsFeature(pathLabel('oneStep', 'absent'))).toBeNull();
    });

    it('a name label never carries a feature, whatever editable says', () => {
        for (const key of ['literal', 'name', 'qualifiedName', 'metaclassName']) {
            for (const editable of Object.keys(EDITABLES)) {
                expect(labelEditsFeature(labelOf(key, editable)), `${key}/${editable}`).toBeNull();
            }
        }
    });
});

describe('labelFeatureEditBlock: the metamodel half, shared by the panel and the canvas', () => {
    const EXPECTED_BLOCK: Record<string, LabelEditBlock | null> = {
        stringAttr: null,
        multiValued: 'single-attribute',
        reference: 'single-attribute',
        intAttr: 'string-only',
        boolAttr: 'string-only',
        unknown: 'single-attribute',
    };
    for (const info of Object.keys(INFOS)) {
        it(`${info} is ${EXPECTED_BLOCK[info]}`, () => {
            expect(labelFeatureEditBlock(INFOS[info])).toBe(EXPECTED_BLOCK[info]);
        });
    }

    it('a multi-valued attribute is blocked: dropping the upperBound check kills this test', () => {
        expect(labelFeatureEditBlock(INFOS.multiValued)).toBe('single-attribute');
        expect(labelFeatureEditBlock({ kind: 'attribute', type: 'EString', upperBound: 0 })).toBe('single-attribute');
    });

    it('a reference to a string-named class is blocked: dropping the kind check kills this test', () => {
        expect(labelFeatureEditBlock({ kind: 'reference', type: 'EString', upperBound: 1 })).toBe('single-attribute');
    });
});

describe('labelEditBlock: why the toggle is disabled, per source and feature', () => {
    it('a name or qualifiedName label is never blocked, whatever the feature', () => {
        for (const key of ['name', 'qualifiedName']) {
            for (const info of Object.keys(INFOS)) {
                expect(labelEditBlock(SOURCES[key], INFOS[info]), `${key}/${info}`).toBeNull();
            }
        }
    });

    it('a literal and a metaclassName are name-only, whatever the feature', () => {
        for (const key of ['literal', 'metaclassName']) {
            for (const info of Object.keys(INFOS)) {
                expect(labelEditBlock(SOURCES[key], INFOS[info]), `${key}/${info}`).toBe('name-only');
            }
        }
    });

    it('a path that is not one step is single-attribute even on a string attribute', () => {
        for (const path of ['multiStep', 'values', 'valuesAt']) {
            expect(labelEditBlock(PATHS[path], INFOS.stringAttr), path).toBe('single-attribute');
        }
    });

    it('a one-step path answers with its feature', () => {
        expect(labelEditBlock(PATHS.oneStep, INFOS.stringAttr)).toBeNull();
        expect(labelEditBlock(PATHS.oneStep, INFOS.reference)).toBe('single-attribute');
        expect(labelEditBlock(PATHS.oneStep, INFOS.multiValued)).toBe('single-attribute');
        expect(labelEditBlock(PATHS.oneStep, INFOS.intAttr)).toBe('string-only');
        expect(labelEditBlock(PATHS.oneStep, INFOS.unknown)).toBe('single-attribute');
    });
});

describe('labelEditable: what the toggle reads', () => {
    it('a one-step path on a string attribute: OFF absent, ON true, OFF false, ON widget', () => {
        expect(labelEditable(pathLabel('oneStep', 'absent'), INFOS.stringAttr)).toBe(false);
        expect(labelEditable(pathLabel('oneStep', 'on'), INFOS.stringAttr)).toBe(true);
        expect(labelEditable(pathLabel('oneStep', 'off'), INFOS.stringAttr)).toBe(false);
        expect(labelEditable(pathLabel('oneStep', 'widget'), INFOS.stringAttr)).toBe(true);
    });

    it('a stored true on a blocked path still reads OFF', () => {
        for (const info of ['multiValued', 'reference', 'intAttr', 'boolAttr', 'unknown']) {
            expect(labelEditable(pathLabel('oneStep', 'on'), INFOS[info]), info).toBe(false);
        }
        expect(labelEditable(pathLabel('multiStep', 'on'), INFOS.stringAttr)).toBe(false);
    });

    it('agrees with labelEditsName on every non-path label, so name labels are unchanged', () => {
        for (const key of ['literal', 'name', 'qualifiedName', 'metaclassName']) {
            for (const editable of Object.keys(EDITABLES)) {
                const label = labelOf(key, editable);
                expect(labelEditable(label, INFOS.stringAttr), `${key}/${editable}`).toBe(EXPECTED[key][editable]);
                expect(labelEditable(label, null), `${key}/${editable}`).toBe(labelEditsName(label));
            }
        }
    });
});

/** A plain idlookup as the canvas reads it: object, DValue slots, features, type classifiers. */
const LOOKUP: Record<string, any> = {
    o1: { className: 'DObject', name: 'b1', features: ['v_title', 'v_tags', 'v_owner', 'v_count', 'v_untyped'] },
    v_title: { className: 'DValue', instanceof: 'a_title', values: ['Moby'] },
    v_tags: { className: 'DValue', instanceof: 'a_tags', values: [] },
    v_owner: { className: 'DValue', instanceof: 'r_owner', values: [] },
    v_count: { className: 'DValue', instanceof: 'a_count', values: [3] },
    v_untyped: { className: 'DValue', instanceof: 'a_untyped', values: [] },
    a_title: { className: 'DAttribute', name: 'title', type: 'Pointer_ESTRING', upperBound: 1 },
    a_tags: { className: 'DAttribute', name: 'tags', type: 'Pointer_ESTRING', upperBound: -1 },
    r_owner: { className: 'DReference', name: 'owner', type: 'c_person', upperBound: 1 },
    a_count: { className: 'DAttribute', name: 'count', type: 'Pointer_EINT', upperBound: 1 },
    a_untyped: { className: 'DAttribute', name: 'untyped' },
    Pointer_ESTRING: { className: 'DClass', name: 'EString' },
    Pointer_EINT: { className: 'DClass', name: 'EInt' },
    c_person: { className: 'DClass', name: 'Person' },
};

describe('labelFeatureInfoOf: the canvas reads the slot from idlookup', () => {
    it('a single-valued string attribute', () => {
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'title')).toEqual({ kind: 'attribute', type: 'EString', upperBound: 1 });
    });

    it('the multiplicity, the reference kind and the type name are read from the feature', () => {
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'tags')).toEqual({ kind: 'attribute', type: 'EString', upperBound: -1 });
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'owner')).toEqual({ kind: 'reference', type: 'Person', upperBound: 1 });
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'count')).toEqual({ kind: 'attribute', type: 'EInt', upperBound: 1 });
    });

    it('a missing type and bound read as the panel reads them (EString, 1)', () => {
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'untyped')).toEqual({ kind: 'attribute', type: 'EString', upperBound: 1 });
    });

    it('null for a feature the object has no slot for, a missing object or no lookup', () => {
        expect(labelFeatureInfoOf(LOOKUP, 'o1', 'nope')).toBeNull();
        expect(labelFeatureInfoOf(LOOKUP, 'o2', 'title')).toBeNull();
        expect(labelFeatureInfoOf(undefined, 'o1', 'title')).toBeNull();
    });

    it('the canvas and the panel agree on the same metaclass', () => {
        const panel: Record<string, LabelFeatureInfo> = {
            title: { kind: 'attribute', type: 'EString', upperBound: 1 },
            tags: { kind: 'attribute', type: 'EString', upperBound: -1 },
            owner: { kind: 'reference', type: 'Person', upperBound: 1 },
            count: { kind: 'attribute', type: 'EInt', upperBound: 1 },
        };
        for (const name of Object.keys(panel)) {
            const source: TextSource = { from: 'path', expr: `$${name}.value` };
            expect(labelEditBlock(source, labelFeatureInfoOf(LOOKUP, 'o1', name)), name)
                .toBe(labelEditBlock(source, panel[name]));
        }
    });
});

describe('the compile carries editsFeature only when the predicate says so', () => {
    it('for every path shape and editable value, the key is present iff labelEditsFeature is non-null', () => {
        clearCompileCache();
        for (const path of Object.keys(PATHS)) {
            for (const editable of Object.keys(EDITABLES)) {
                const label = pathLabel(path, editable);
                const ir = {
                    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Book'],
                    shape: { form: 'rect', labels: [label] },
                } as VertexViewIR;
                const compiled = compileView(`v_feat_${path}_${editable}`, ir).labels[0];
                const expected = labelEditsFeature(label);
                expect('editsFeature' in compiled, `${path}/${editable}`).toBe(expected !== null);
                expect(compiled.editsFeature ?? null, `${path}/${editable}`).toBe(expected);
                expect(compiled.editsName, `${path}/${editable}`).toBe(false);
            }
        }
    });

    it('an opted-in one-step path compiles with its feature; dropping the assignment kills this test', () => {
        clearCompileCache();
        const ir = {
            irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Book'],
            shape: { form: 'rect', labels: [pathLabel('oneStep', 'on')] },
        } as VertexViewIR;
        expect(compileView('v_feat_on', ir).labels[0].editsFeature).toBe('title');
    });

    it('a name label compiles without the key', () => {
        clearCompileCache();
        for (const key of Object.keys(SOURCES)) {
            const ir = {
                irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Book'],
                shape: { form: 'rect', labels: [labelOf(key, 'on')] },
            } as VertexViewIR;
            const compiled = compileView(`v_feat_src_${key}`, ir).labels[0];
            expect('editsFeature' in compiled, key).toBe(key === 'path');
        }
    });
});
