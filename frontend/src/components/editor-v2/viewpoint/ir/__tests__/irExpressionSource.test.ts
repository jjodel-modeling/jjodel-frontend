/**
 * The `expression` text source (R-EXP-2): its compiled handlers, the injected reader of the draw backend and the
 * `x=` term of the object snapshot, which is what moves an owner's memo when a folded constant changes.
 *
 * Each test name declares the mutation that kills it (CLAUDE.md section 5).
 */
import { describe, it, expect } from 'vitest';
import { compileEdgeView, compileView } from '../irCompile';
import { makeDrawReadCtx, type ReadCtx } from '../irReadCtx';
import { objectSnapshotParts } from '../irResolveCore';
import { validateIR } from '../irValidate';
import type { EdgeViewIR, VertexViewIR } from '../irTypes';
import { encodeExprBinding } from '../../../../../model/expression/exprBinding';

type Lookup = Record<string, any>;

const reader = (id: string, slot: string): string => `${id}/${slot}`;
const injected = makeDrawReadCtx({}, undefined, undefined, undefined, reader);

let viewSeq = 0;
function compiledLabels(labels: NonNullable<VertexViewIR['shape']['labels']>) {
    const ir: VertexViewIR = { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Reg'], shape: { form: 'rect', labels } };
    return compileView(`expr_source_${++viewSeq}`, ir).labels;
}

function edgeText(template: EdgeViewIR['edge']['labels']): (ctx: ReadCtx, id: string) => unknown {
    const ir = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Link'], edge: { labels: template } } as unknown as EdgeViewIR;
    return compileEdgeView(`expr_edge_${++viewSeq}`, ir).labelText as (ctx: ReadCtx, id: string) => unknown;
}

describe('the expression source of a vertex label', () => {
    it('reads the slot through the injected reader (dies if the handler drops the slot)', () => {
        const [label] = compiledLabels([{ position: 'inside', source: { from: 'expression', slot: 'next' } }]);
        expect(label.text(injected, 'o1')).toBe('o1/next');
    });

    it('marks the compiled label and carries its caption (dies if CompiledLabel.expression is not set)', () => {
        const [label] = compiledLabels([{ position: 'inside', source: { from: 'expression', slot: 'next', caption: 'next value' } }]);
        expect(label.expression).toEqual({ caption: 'next value' });
    });

    it('leaves every other label unmarked (dies if the mark is unconditional)', () => {
        const [path, literal] = compiledLabels([
            { position: 'top', source: { from: 'intrinsic', prop: 'name' } },
            { position: 'inside', source: { from: 'literal', text: 'x' } },
        ]);
        expect(path.expression).toBeUndefined();
        expect(literal.expression).toBeUndefined();
    });

    it('reads empty on a ReadCtx with no reader (dies if the optional call is not guarded)', () => {
        const [label] = compiledLabels([{ position: 'inside', source: { from: 'expression', slot: 'next' } }]);
        const bare = { ...injected, getExpressionText: undefined } as ReadCtx;
        expect(label.text(bare, 'o1')).toBe('');
    });
});

describe('the expression source of an edge label', () => {
    const template = [{ from: 'literal', text: 'x = ' }, { from: 'expression', slot: 's' }] as NonNullable<EdgeViewIR['edge']['labels']>['template'];

    it('concatenates like a value segment (dies if the handler is missing from compileTextSource)', () => {
        expect(edgeText({ template })(injected, 'e')).toBe('x = e/s');
    });

    it('takes its caption with it when empty (dies if expression is not a value segment at compileLabelText)', () => {
        const empty = makeDrawReadCtx({}, undefined, undefined, undefined, () => '');
        expect(edgeText({ template })(empty, 'e')).toBe('');
    });
});

describe('makeDrawReadCtx, the injected reader', () => {
    it('answers empty when nothing is injected (dies if the default is dropped)', () => {
        expect(makeDrawReadCtx({}).getExpressionText?.('o', 's')).toBe('');
    });
});

describe('validateIR on the expression source', () => {
    it('accepts it as a template segment (dies if TEXT_SOURCE_KINDS does not list the kind)', () => {
        const ir = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Link'], edge: { labels: { template: [{ from: 'expression', slot: 's' }] } } } as unknown as EdgeViewIR;
        expect(validateIR('v', ir)).toMatchObject({ ok: true });
    });

    it('accepts it on an end, and refuses a slot that is not a string (dies if isEndTextSource skips the slot type)', () => {
        const ir = (slot: unknown) => ({ irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Link'], edge: { labels: { sourceEnd: { from: 'expression', slot } } } }) as unknown as EdgeViewIR;
        expect(validateIR('v', ir('s'))).toMatchObject({ ok: true });
        expect(validateIR('v', ir(1))).toMatchObject({ ok: false });
    });
});

describe('objectSnapshotParts, the expression term', () => {
    const binding = encodeExprBinding({
        v: 1, parens: 'minimal',
        slots: [{ class: 'C_Reg', feature: 'R_next' }],
        roles: [{ class: 'C_Const', role: 'literal', attribute: 'A_value' }],
    });

    function world(raw?: string): Lookup {
        return {
            MM: { id: 'MM', className: 'DModel', name: 'mm', _state: raw === undefined ? {} : { exprBinding: raw } },
            M1: { id: 'M1', className: 'DModel', name: 'm', instanceof: 'MM' },
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

    it('is byte-identical with no binding (dies if the term is pushed when empty)', () => {
        expect(objectSnapshotParts(world(), 'r1', 'sig')).toEqual([
            'sig', 'r1', 'C_Reg', 'v_next=["e1"]', 'n="r1"', 'c="Reg"',
        ]);
    });

    it('is byte-identical on an object that owns no slot, the binding present (dies if the term ignores the owner)', () => {
        const parts = objectSnapshotParts(world(binding), 'e1', 'sig')!;
        expect(parts.some(p => p.startsWith('x='))).toBe(false);
    });

    it('carries the text term on an owner (dies if the term is not pushed)', () => {
        const parts = objectSnapshotParts(world(binding), 'r1', 'sig')!;
        expect(parts.filter(p => p.startsWith('x='))).toHaveLength(1);
    });

    it('moves when a folded constant changes (dies if the term does not read the printed text)', () => {
        const before = world(binding);
        const after = { ...before, v_value: { ...before.v_value, values: [8] } };
        const term = (w: Lookup) => objectSnapshotParts(w, 'r1', 'sig')!.find(p => p.startsWith('x='));
        expect(term(after)).not.toBe(term(before));
    });
});
