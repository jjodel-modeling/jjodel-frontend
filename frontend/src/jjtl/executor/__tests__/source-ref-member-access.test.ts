import { describe, it, expect, vi } from 'vitest';

/**
 * Member access through a source reference (F4).
 *
 * ProjectEditor hands the executor every reference value as `{ __ref: pointerId }`
 * (`wrapIfRef`). A binding that reads an attribute THROUGH such a value, `src.name`
 * or `owner.name`, read the attribute of the wrapper, which has none, and got null
 * without a warning. The hardware demonstrator needs it wherever a connection names
 * both of its ends (`docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`
 * §4.5, variants `flat`, `nav`, `navResolveRev`).
 *
 * The same values must keep resolving source to TARGET exactly as before when a
 * binding assigns them (`port := tgt`, `resolve(tgt, T)`): those tests pin that
 * the dereference is a read-through, not a replacement of the wrapper.
 *
 * The `joiner` barrel is mocked as in `contained-sources.test.ts`; the lexer,
 * parser and executor run unstubbed.
 */
vi.mock('../../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../../parser/parser';
import { execute } from '../executor';
import type { TransformationAST } from '../../types/ast';

function parseJjtl(source: string): TransformationAST {
    const { tokens, errors: lexErrors } = new JjtlLexer(source.trim()).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    expect(ast).not.toBeNull();
    return ast!;
}

// A fragment of a Verilog AST, in the shape ProjectEditor hands over.
const VERILOG = {
    classes: [
        {
            className: 'DClass', name: 'Module',
            allAttributes: [{ name: 'name' }],
            allReferences: [{ name: 'items', composition: true, type: { name: 'PortDeclaration' } }],
        },
        {
            className: 'DClass', name: 'PortDeclaration',
            allAttributes: [{ name: 'direction' }],
            allReferences: [{ name: 'ports', composition: true, type: { name: 'PortId' } }],
        },
        {
            className: 'DClass', name: 'PortId',
            allAttributes: [{ name: 'name' }],
            allReferences: [],
        },
        {
            className: 'DClass', name: 'PortConnection',
            allAttributes: [{ name: 'expression' }],
            allReferences: [{ name: 'port', composition: false, type: { name: 'PortId' } }],
        },
    ],
};

// Source objects as ProjectEditor builds them: every reference is a `{ __ref }`.
// `Note` has no rule: a reference to it resolves to null (fail-open).
const HW = [
    { id: 'C1', name: 'alu', className: 'Component', __type: 'Component', ports: [{ __ref: 'P1' }, { __ref: 'P2' }] },
    { id: 'C2', name: 'acc', className: 'Component', __type: 'Component', ports: [{ __ref: 'P3' }] },
    { id: 'P1', name: 'a', className: 'Port', __type: 'Port', dir: 'IN', owner: { __ref: 'C1' } },
    { id: 'P2', name: 'y', className: 'Port', __type: 'Port', dir: 'OUT', owner: { __ref: 'C1' } },
    { id: 'P3', name: 'd', className: 'Port', __type: 'Port', dir: 'IN', owner: { __ref: 'C2' } },
    { id: 'N1', name: 'n', className: 'Note', __type: 'Note' },
    { id: 'W1', name: 'w1', className: 'Wire', __type: 'Wire', src: { __ref: 'P2' }, tgt: { __ref: 'P3' }, note: { __ref: 'N1' } },
];

async function run(rules: string) {
    const ast = parseJjtl(`transformation H2V\nfrom Hw\nto V\n${rules}`);
    const result = await execute(ast, HW as any, VERILOG as any);
    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    const of = (cls: string): any[] => (result.targetModel?.instances.get(cls) ?? []) as any[];
    return { result, of };
}

describe('JjTL — member access through a source { __ref }', () => {
    it('reads the attribute of the referenced source object (nav)', async () => {
        const { of } = await run(`
Wire -> PortConnection {
  expression := src.name
}
Port -> PortId {
  name := owner.name + "_" + name
}`);
        expect(of('PortConnection').map(c => c.expression)).toEqual(['y']);
        expect(of('PortId').map(p => p.name)).toEqual(['alu_a', 'alu_y', 'acc_d']);
    });

    it('does not depend on rule order (navResolveRev, read through the source)', async () => {
        // The Wire rule runs first in pass 2: before the fix only resolve(src, PortId).name
        // could read the name, and in this order it read the target before its rule filled it.
        const { of } = await run(`
Wire -> PortConnection {
  port := resolve(tgt, PortId)
  expression := src.name + " -> " + tgt.name
}
Port -> PortId {
  name := name
}`);
        expect(of('PortConnection').map(c => c.expression)).toEqual(['y -> d']);
    });

    it('follows a reference read through another reference', async () => {
        const { of } = await run(`
Wire -> PortConnection {
  expression := src.owner.name + "_" + src.name
}`);
        expect(of('PortConnection').map(c => c.expression)).toEqual(['alu_y']);
    });

    it('reads through the elements of a multi-valued reference', async () => {
        const { of } = await run(`
Component -> Module {
  name := name + "_" + ports.first.name + "_" + ports.size
}`);
        expect(of('Module').map(m => m.name)).toEqual(['alu_a_2', 'acc_d_1']);
    });

    it('keeps the source-to-target resolution of the same values (flat)', async () => {
        const { of } = await run(`
Component -> Module {
  name := name
  items := resolve(ports, PortDeclaration)
}
Port -> PortDeclaration {
  direction := if dir == "IN" then "INPUT" else "OUTPUT"
  ports := resolve(self, PortId)
}
Port -> PortId {
  name := name
}
Wire -> PortConnection {
  port := resolve(tgt, PortId)
  expression := src.name + "_" + tgt.name
}`);
        const [alu, acc] = of('Module');
        expect(alu.items.__ref_result).toBe(true);
        expect(alu.items.targets.map((t: any) => t.__sourceId)).toEqual(['P1', 'P2']);
        expect(acc.items.targets.map((t: any) => t.__sourceId)).toEqual(['P3']);
        expect(of('PortDeclaration').map(d => d.direction)).toEqual(['INPUT', 'OUTPUT', 'INPUT']);

        const [conn] = of('PortConnection');
        const portIds = of('PortId');
        expect(conn.port.__ref_result).toBe(true);
        expect(conn.port.targets).toEqual([portIds[2]]);
        expect(portIds[2].name).toBe('d');
        expect(conn.expression).toBe('y_d');
    });

    it('keeps the implicit resolution of a reference binding', async () => {
        const { of } = await run(`
Port -> PortId {
  name := name
}
Wire -> PortConnection {
  port := tgt
}`);
        const [conn] = of('PortConnection');
        expect(conn.port.targets).toEqual([of('PortId')[2]]);
    });

    it('keeps a reference to a type no rule maps fail-open to null', async () => {
        const { of } = await run(`
Wire -> PortConnection {
  port := note
  expression := note.name
}`);
        const [conn] = of('PortConnection');
        expect(conn.port).toBeNull();
        expect(conn.expression).toBe('n');
    });
});
