/**
 * exprFoldViews — the term the fold adds to the hidden union, the documents of the fold viewpoint and what
 * authoring says about the binding (R-EXP-4, R-EXP-12).
 *
 * The hook that joins the union (useIRContainment) imports the joiner and cannot load in the node bench;
 * `exprFoldHidden` is what it joins. Each test name declares the mutation that kills it (CLAUDE.md section 5).
 */
import { describe, it, expect } from 'vitest';
import { encodeExprBinding, type ExprBinding } from '../exprBinding';
import { exprFoldHidden, exprFoldStatus, exprFoldViews } from '../exprFoldViews';
import { validateIR } from '../../../components/editor-v2/viewpoint/ir/irValidate';
import { viewNeedsMount } from '../../../components/editor-v2/onlyRenderVisible';

type Lookup = Record<string, any>;

const BINDING: ExprBinding = {
    v: 1,
    parens: 'minimal',
    slots: [{ class: 'C_Reg', feature: 'R_next', caption: 'next' }],
    roles: [{ class: 'C_Const', role: 'literal', attribute: 'A_value' }],
};

/** One register in M1 whose `next` is a constant; the metamodel carries `raw`, when given, as its binding. */
function world(raw?: unknown): Lookup {
    return {
        MM: { id: 'MM', className: 'DModel', name: 'mm', _state: raw === undefined ? {} : { exprBinding: raw } },
        M1: { id: 'M1', className: 'DModel', name: 'm', instanceof: 'MM' },
        VP_fold: { id: 'VP_fold', _state: { exprFold: true } },
        VP_plain: { id: 'VP_plain' },
        C_Reg: { id: 'C_Reg', className: 'DClass', name: 'Reg', extends: [], references: ['R_next'], attributes: [], father: 'MM' },
        C_Const: { id: 'C_Const', className: 'DClass', name: 'Const', extends: [], references: [], attributes: ['A_value'], father: 'MM' },
        R_next: { id: 'R_next', className: 'DReference', name: 'next', composition: true, father: 'C_Reg' },
        A_value: { id: 'A_value', className: 'DAttribute', name: 'value', father: 'C_Const' },
        r1: { id: 'r1', className: 'DObject', name: 'r1', instanceof: 'C_Reg', father: 'M1', features: ['v_next'] },
        v_next: { id: 'v_next', className: 'DValue', instanceof: 'R_next', father: 'r1', values: ['e1'] },
        e1: { id: 'e1', className: 'DObject', name: 'e1', instanceof: 'C_Const', father: 'r1', features: ['v_value'] },
        v_value: { id: 'v_value', className: 'DValue', instanceof: 'A_value', father: 'e1', values: [7] },
    };
}

const SKETCH = {
    classes: [
        { id: 'C_Base', name: 'Base', abstract: true, supers: [] },
        { id: 'C_Reg', name: 'Reg', abstract: false, supers: ['C_Base'] },
        { id: 'C_Fast', name: 'Fast', abstract: false, supers: ['C_Reg'] },
        { id: 'C_Const', name: 'Const', abstract: false, supers: [] },
        { id: 'C_Host', name: 'Host', abstract: false, supers: [] },
    ],
    attributes: [{ id: 'A_value', name: 'value', owner: 'C_Const' }],
    references: [
        { id: 'R_type', name: 'type', owner: 'C_Base' },
        { id: 'R_next', name: 'next', owner: 'C_Reg' },
    ],
};

const SKETCH_BINDING: ExprBinding = {
    v: 1,
    parens: 'minimal',
    slots: [
        { class: 'C_Base', feature: 'R_type' },
        { class: 'C_Reg', feature: 'R_next', caption: 'next value' },
    ],
    roles: [],
};

describe('exprFoldHidden, the term of the hidden union', () => {
    it('is the folded objects on an activating viewpoint with a valid binding (dies if the fold set is not read)', () => {
        expect([...exprFoldHidden(world(encodeExprBinding(BINDING)), 'VP_fold', 'M1')]).toEqual(['e1']);
    });

    it('is empty on a viewpoint without exprFold, the binding present (dies if the activation is not asked, R-EXP-4)', () => {
        expect(exprFoldHidden(world(encodeExprBinding(BINDING)), 'VP_plain', 'M1').size).toBe(0);
    });

    it('is empty on a metamodel with no binding: the objects stay nodes (R-EXP-12)', () => {
        expect(exprFoldHidden(world(), 'VP_fold', 'M1').size).toBe(0);
    });

    it('is empty on an invalid binding: the objects stay nodes (R-EXP-12)', () => {
        expect(exprFoldHidden(world('{not json'), 'VP_fold', 'M1').size).toBe(0);
    });

    it('is empty with no viewpoint or no model (dies if the guard is dropped and the lookup is read at undefined)', () => {
        const w = world(encodeExprBinding(BINDING));
        expect(exprFoldHidden(w, undefined, 'M1').size).toBe(0);
        expect(exprFoldHidden(w, 'VP_fold', null).size).toBe(0);
    });
});

describe('exprFoldViews, one document per owner class', () => {
    const views = exprFoldViews(SKETCH_BINDING, SKETCH);
    const byName = new Map(views.map(v => [v.className, v]));

    it('gives a view to each concrete class whose lineage has a slot, and none to the abstract one (dies if abstract is not skipped)', () => {
        expect(views.map(v => v.className).sort()).toEqual(['Fast', 'Reg']);
    });

    it('puts the name on top and one inside label per slot, inherited slots included (dies if the lineage stops at the class)', () => {
        expect(byName.get('Fast')!.ir.shape.labels).toEqual([
            { position: 'top', source: { from: 'intrinsic', prop: 'name' } },
            { position: 'inside', source: { from: 'expression', slot: 'type', caption: 'type' } },
            { position: 'inside', source: { from: 'expression', slot: 'next', caption: 'next value' } },
        ]);
    });

    it('declares the class by name and its pin (dies if metaclasses or the pin change)', () => {
        const { ir } = byName.get('Reg')!;
        expect(ir.metaclasses).toEqual(['Reg']);
        expect(ir.authoringMetaclassPins).toEqual({ Reg: 'C_Reg' });
    });

    it('needs no node mounted, so the canvas keeps rendering only what is in view (dies if a defaultSize comes back)', () => {
        expect(views.length).toBeGreaterThan(0);
        for (const v of views) expect(viewNeedsMount({ kind: v.ir.kind, ir: v.ir })).toBe(false);
    });

    it('adds the @shared label on the sharing host, a host with no slot included (dies if the host is ignored)', () => {
        const hosted = exprFoldViews({ ...SKETCH_BINDING, sharing: { classes: ['C_Const'], minLength: 40, minCount: 3, prefix: 'D', host: 'C_Host' } }, SKETCH);
        const host = hosted.find(v => v.className === 'Host')!;
        expect(host.ir.shape.labels).toEqual([
            { position: 'top', source: { from: 'intrinsic', prop: 'name' } },
            { position: 'inside', source: { from: 'expression', slot: '@shared' } },
        ]);
    });

    it('produces documents the IR validator accepts', () => {
        for (const v of views) expect(validateIR(v.classId, v.ir)).toMatchObject({ ok: true });
    });
});

describe('exprFoldStatus, what authoring says (R-EXP-12)', () => {
    it('says there is no binding and that the objects stay nodes', () => {
        const status = exprFoldStatus(world(), 'MM');
        expect(status.ok).toBe(false);
        expect(status.text).toMatch(/no expression binding/i);
        expect(status.text).toMatch(/stay nodes/i);
    });

    it('says why an invalid binding is refused (dies if the decode errors are dropped)', () => {
        const status = exprFoldStatus(world('{not json'), 'MM');
        expect(status.ok).toBe(false);
        expect(status.text).toMatch(/invalid/i);
        expect(status.text).toMatch(/stay nodes/i);
        expect(status.text.length).toBeGreaterThan('Invalid expression binding: the objects stay nodes.'.length);
    });

    it('reports the slots and the roles of a valid binding', () => {
        const status = exprFoldStatus(world(encodeExprBinding(BINDING)), 'MM');
        expect(status.ok).toBe(true);
        expect(status.text).toMatch(/1 slot\b/);
        expect(status.text).toMatch(/1 role\b/);
    });
});
