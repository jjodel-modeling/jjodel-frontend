/**
 * `rename ... to <expression>` (R-FA-9, provisional, P-2026-11-02-2030).
 *
 * A single bare identifier (or one string) followed by the end of the command stays the literal
 * name, with the AST it always had; anything else is a JjEL expression in `newNameExpr`, evaluated
 * per execution over the same variables as the `forall` filter. The executor does not import under
 * `environment: 'node'` (monaco, through `joiner`), so its collaborators are replaced: the name
 * resolution, the uniqueness rule and the M1 handler are stubs, the parser, `executeRename`,
 * `executeForAll` and JjEL are the real ones.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from '../../parser/parser';
import { planEffects, type PlanWorld } from '../effectsPlanner';
import type { ExecutionContext, ForAllArgs, RenameArgs, BlockArgs } from '../../types';

const h = vi.hoisted(() => ({
    elements: [] as Array<{ id: string; name: string; className: string; father: string }>,
    instanceCalls: [] as any[],
    classes: [] as any[],
}));

vi.mock('../../../joiner', () => ({}));
vi.mock('../utils', () => ({ getProject: () => ({ id: 'prj' }) }));
vi.mock('../commands/instance', () => ({
    executeRenameInstance: async (args: any) => {
        h.instanceCalls.push(args);
        return { success: true, command: 'rename', message: `Renamed to '${args.newName}'` };
    },
}));
vi.mock('../resolvers', () => ({
    resolveTargetInProject: (target: any) => ({ element: h.elements.find(e => e.name === target.raw) }),
    kindLabel: () => 'Element',
    memberMissingMessage: () => 'missing',
    TARGET_KINDS_BY_ELEMENT_TYPE: {},
    ambiguityMessage: () => 'ambiguous',
    QUALIFY_ADVICE: 'qualify',
}));
vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    m2KindOf: () => 'Class',
    checkM2NameUniqueness: ({ name, excludeId }: any) =>
        h.elements.some(e => e.name === name && e.id !== excludeId)
            ? { ok: false, reason: `'${name}' is taken` }
            : { ok: true },
}));
vi.mock('../commands/eval', () => ({ buildEvalContext: () => ({ classes: h.classes }) }));
vi.mock('../executor', () => ({
    getExecutor: () => ({
        executeAST: async (ast: any, context: any) => {
            if (ast.command === 'forall') {
                const { executeForAll } = await import('../commands/forall');
                return executeForAll(ast.args, context);
            }
            const { executeRename } = await import('../commands/rename');
            return executeRename(ast.args, context);
        },
    }),
}));

function ctx(level: 'M1' | 'M2' = 'M2', vars: Record<string, unknown> = {}): ExecutionContext {
    return { level, variables: new Map(Object.entries(vars)) } as unknown as ExecutionContext;
}

function renameArgs(src: string): RenameArgs {
    const r = parse(src);
    expect(r.success, `${src}: ${r.errors?.map(e => e.message).join(', ')}`).toBe(true);
    return r.ast!.args as RenameArgs;
}

async function run(src: string, context = ctx()) {
    const r = parse(src);
    expect(r.success, `${src}: ${r.errors?.map(e => e.message).join(', ')}`).toBe(true);
    const ast = r.ast!;
    if (ast.command === 'forall') {
        const { executeForAll } = await import('../commands/forall');
        return executeForAll(ast.args as ForAllArgs, context);
    }
    const { executeRename } = await import('../commands/rename');
    return executeRename(ast.args as RenameArgs, context);
}

function setModel(names: string[]) {
    h.elements = names.map((name, i) => ({ id: `c${i}`, name, className: 'DClass', father: 'pkg' }));
    h.classes = names.map(name => ({ name }));
}

describe('rename: the parser', () => {
    it('keeps the literal AST for a single identifier and for one string, `to` and `as` alike', () => {
        expect(parse('rename Person to Human').ast!.args).toEqual(
            { command: 'rename', target: { segments: ['Person'], raw: 'Person' }, newName: 'Human', elementType: undefined });
        expect(parse('rename Person as Human').ast!.args).toEqual(
            { command: 'rename', target: { segments: ['Person'], raw: 'Person' }, newName: 'Human', elementType: undefined });
        expect(parse('rename Foo to "Bar"').ast!.args).toEqual(
            { command: 'rename', target: { segments: ['Foo'], raw: 'Foo' }, newName: 'Bar', elementType: undefined });
        expect(Object.keys(renameArgs('rename class Person to Human'))).not.toContain('newNameExpr');
    });

    it('a name a forall variable also has stays literal: `rename b to dup` never reads `dup`', () => {
        const f = parse('forall dup in classes do rename dup to dup').ast!.args as ForAllArgs;
        expect(f.body.args).toEqual({ command: 'rename', target: { segments: ['dup'], raw: 'dup' }, newName: 'dup', elementType: undefined });
    });

    it('anything else is an expression, kept as written', () => {
        expect(renameArgs('rename c to "Abstract_" + c.name').newNameExpr).toBe('"Abstract_" + c.name');
        expect(renameArgs('rename Foo as b.name').newNameExpr).toBe('b.name');
        expect(renameArgs('rename Foo to x + ""').newNameExpr).toBe('x + ""');
        const a = renameArgs('rename attribute x in C to x + "_old"');
        expect(a.target).toEqual({ segments: ['C'], member: 'x', raw: 'C.x' });
        expect(a.elementType).toBe('attribute');
        expect(a.newNameExpr).toBe('x + "_old"');
    });

    it('a single name followed by a trailing `in` stays literal, as the prompts write it', () => {
        expect(renameArgs('rename attribute oldAttr to newAttr in ClassName').newNameExpr).toBeUndefined();
    });

    it('inside a block the expression stops at the end of the command', () => {
        for (const src of [
            'do\nrename Foo to "x" + c.name\nrename Bar to Baz\nend',
            'do rename Foo to "x" + c.name; rename Bar to Baz end',
            'do rename Foo to "x" + c.name rename Bar to Baz end',
        ]) {
            const r = parse(src);
            expect(r.success, `${src}: ${r.errors?.map(e => e.message).join(', ')}`).toBe(true);
            const [first, second] = (r.ast!.args as BlockArgs).commands;
            expect((first.args as RenameArgs).newNameExpr).toBe('"x" + c.name');
            expect(second.args).toEqual({ command: 'rename', target: { segments: ['Bar'], raw: 'Bar' }, newName: 'Baz', elementType: undefined });
        }
        const only = (parse('do rename Foo to "a" + (b) end').ast!.args as BlockArgs).commands[0].args as RenameArgs;
        expect(only.newNameExpr).toBe('"a" + (b)');
    });

    it('a single-line block with juxtaposed commands keeps its literal AST', () => {
        const r = parse('do rename Foo to x rename Bar to y end');
        expect((r.ast!.args as BlockArgs).commands.map(c => c.args)).toEqual([
            { command: 'rename', target: { segments: ['Foo'], raw: 'Foo' }, newName: 'x', elementType: undefined },
            { command: 'rename', target: { segments: ['Bar'], raw: 'Bar' }, newName: 'y', elementType: undefined },
        ]);
    });

    it('a missing name is still a parse error', () => {
        expect(parse('rename Foo to').success).toBe(false);
    });
});

describe('rename: the expression, executed', () => {
    beforeEach(() => { h.instanceCalls.length = 0; setModel(['A', 'B']); });

    it('forall c in classes do rename c to "Abstract_" + c.name', async () => {
        const res = await run('forall c in classes do rename c to "Abstract_" + c.name');
        expect(res.success).toBe(true);
        expect(h.elements.map(e => e.name)).toEqual(['Abstract_A', 'Abstract_B']);
    });

    it('two variables: the duplicate gets its own computed name', async () => {
        setModel(['A', 'B', 'C']);
        // Distinct ids: JjEL `!=` compares the two shells by value.
        h.classes = [{ id: 'c0', name: 'A' }, { id: 'c1', name: 'B' }, { id: 'c2', name: 'A' }];
        // Target resolution stays by name (the forall substitutes the name, `forall.ts:79-82`); the stub
        // resolves the first element named A, so only the computed name is under test here.
        h.elements[2].name = 'A';
        const res = await run('forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"');
        // Two ordered pairs reach the same name: the second rename is refused as two consecutive
        // `rename A to A_dup` lines would be.
        expect(h.elements.map(e => e.name)).toEqual(['A_dup', 'B', 'A']);
        expect(res.success).toBe(false);
        expect(JSON.stringify(res.errors)).toContain('NAME_CONFLICT');
    });

    it('rename Foo to "Bar", outside a forall', async () => {
        setModel(['Foo']);
        const res = await run('rename Foo to "Bar"');
        expect(res.success).toBe(true);
        expect(h.elements[0].name).toBe('Bar');
    });

    it('a constant expression outside a forall', async () => {
        setModel(['Foo']);
        expect((await run('rename Foo to "Ba" + "r"')).success).toBe(true);
        expect(h.elements[0].name).toBe('Bar');
    });

    it('the literal form with a variable of the same name renames to the name, not the value', async () => {
        setModel(['Foo']);
        const res = await run('rename Foo to dup', ctx('M2', { dup: 'Other' }));
        expect(res.success).toBe(true);
        expect(h.elements[0].name).toBe('dup');
    });

    it('a variable read through `x + ""`', async () => {
        setModel(['Foo']);
        expect((await run('rename Foo to x + ""', ctx('M2', { x: 'Bar' }))).success).toBe(true);
        expect(h.elements[0].name).toBe('Bar');
    });

    it('a `let` binding `$x` is an expression and reads the binding', async () => {
        setModel(['Foo']);
        expect(renameArgs('rename Foo to $x').newNameExpr).toBe('$x');
        expect((await run('rename Foo to $x', ctx('M2', { $x: 'Bar' }))).success).toBe(true);
        expect(h.elements[0].name).toBe('Bar');
    });

    it('`as` as well as `to`', async () => {
        setModel(['Foo']);
        expect((await run('rename Foo as "Ba" + "r"')).success).toBe(true);
        expect(h.elements[0].name).toBe('Bar');
    });

    it('rename attribute x in C to ...', async () => {
        h.elements = [{ id: 'a1', name: 'C.x', className: 'DAttribute', father: 'C' }];
        const res = await run('rename attribute x in C to "x" + "_old"');
        expect(res.success).toBe(true);
        expect(h.elements[0].name).toBe('x_old');
    });

    it('a non-string, an empty string and a null result are the command error, with the expression and the value', async () => {
        setModel(['Foo']);
        for (const [src, value] of [['rename Foo to 1 + 2', '3'], ['rename Foo to "" + ""', '""'], ['rename Foo to null + null', 'null']] as const) {
            const res = await run(src);
            expect(res.success, src).toBe(false);
            expect(res.errors?.[0].code).toBe('INVALID_NAME');
            expect(res.message).toContain(src.slice('rename Foo to '.length));
            expect(res.message).toContain(value);
        }
        expect(h.elements[0].name).toBe('Foo');
    });

    it('a null element name never reaches the setter', async () => {
        setModel(['Foo']);
        const res = await run('rename Foo to missing.name', ctx('M2', { missing: {} }));
        expect(res.success).toBe(false);
        expect(h.elements[0].name).toBe('Foo');
    });

    it('a computed name that is not an identifier is refused at M2 with the expression and the value', async () => {
        setModel(['Foo']);
        const res = await run('rename Foo to "a b" + ""');
        expect(res.success).toBe(false);
        expect(res.errors?.[0].code).toBe('INVALID_NAME');
        expect(res.message).toContain('"a b" + ""');
        expect(res.message).toContain('a b');
    });

    it('a JjEL error is the command error, with the expression', async () => {
        setModel(['Foo']);
        const res = await run('rename Foo to "a" +');
        expect(res.success).toBe(false);
        expect(res.message).toContain('"a" +');
        expect(h.elements[0].name).toBe('Foo');
    });

    it('at M1 the computed name goes to the instance handler, resolved', async () => {
        const res = await run('rename p1 to "p_" + "2"', ctx('M1'));
        expect(res.success).toBe(true);
        expect(h.instanceCalls).toHaveLength(1);
        expect(h.instanceCalls[0].newName).toBe('p_2');
        expect(h.instanceCalls[0].newNameExpr).toBeUndefined();
    });
});

describe('rename: the effects preview', () => {
    const world: PlanWorld = { classes: {}, elements: [] };

    it('a computed name outside a forall is not planned: unsupported, the expression named', async () => {
        const plan = await planEffects('rename Foo to "Abstract_" + "x"', world);
        expect(plan.renamed).toEqual([]);
        expect(plan.warnings).toEqual([{ line: 1, code: 'UNSUPPORTED', message: 'unsupported: rename to a computed name ("Abstract_" + "x")' }]);
    });

    it('inside a forall it stays `unsupported: forall`', async () => {
        const plan = await planEffects('forall c in classes do rename c to "Abstract_" + c.name', world);
        expect(plan.warnings).toEqual([{ line: 1, code: 'UNSUPPORTED', message: 'unsupported: forall' }]);
    });
});
