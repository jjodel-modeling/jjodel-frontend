/**
 * Four JjScript console defects, seen in the app on 2026-11-02 and reproduced here (P-2026-11-03-0000).
 *
 * 2. `create class Foo in P1` with no P1 reported success and made a class with no father.
 * 1. `create package P2` failed with «Cannot read properties of undefined (reading 'cname')».
 * 3. `eval` rebuilt its expression from token values joined by spaces: `=>` became `= >`, a string
 *    lost its quotes, `$x.size` became `$ x.size`.
 * 4. A `let` value stopped at the first top-level `in`: `forall` lexes as a COMMAND, which the
 *    quantifier count did not see, and the commas of R-FA-5 ended the value.
 *
 * Real: the parser, `executeCreate`, `resolvers.ts`, `executeEval`, `buildEvalContext`, `executeLet`, JjEL.
 * Stubbed: the `joiner` barrel (monaco, `window is not defined` under node; the Proxy stub of
 * `forallById.test.ts`), with `DPackage.new` and `DClass.new` recording their father. The `DPackage`
 * stub reads `fatherType.cname` when it has a father, as `Constructors.DPackage` does
 * (`joiner/classes.ts:996-997`): that read is the crash of defect 1. `../utils` is stubbed because it
 * imports `DockManager`; its `getDefaultParent` stub returns what the real one does for a context that
 * names its metamodel (`utils.ts:270-275`: the first package, else the metamodel), and `needsParent`
 * is the real list. `nameUniqueness` accepts every name, and the executor only dispatches.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
    project: null as any,
    metamodel: null as any,
    created: [] as Array<{ kind: string; name: string; father: any; fatherType?: string }>,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        DModel: { cname: 'DModel' },
        DPackage: {
            cname: 'DPackage',
            new: (name: string, _uri: any, _prefix: any, father: any, _persist: boolean, fatherType?: { cname: string }) => {
                if (father) void fatherType!.cname;
                h.created.push({ kind: 'package', name, father, fatherType: fatherType?.cname });
                return { id: 'new_' + name, name };
            },
        },
        DClass: {
            cname: 'DClass',
            new: (name: string, _i: any, _a: any, _p: any, _pa: any, _pd: any, father: any) => {
                h.created.push({ kind: 'class', name, father });
                return { id: 'new_' + name, name };
            },
        },
        LPointerTargetable: { fromD: (d: any) => d, fromPointer: () => null },
        store: { getState: () => ({ m2models: [], idlookup: {} }) },
        Defaults: { primitiveTypeIds: new Set<string>() },
        TRANSACTION: (_name: string, f: () => void) => f(),
        SetFieldAction: { new: () => undefined },
    };
    return new Proxy(named, {
        get: (t, k) => (k === 'then' ? undefined
            : k in t ? t[k as string]
            : class Stub { static cname = String(k); }),
        has: () => true,
    });
});
vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => h.metamodel,
    getDefaultParent: () => (h.metamodel.packages.length > 0 ? h.metamodel.packages[0] : h.metamodel),
    needsParent: (t: string) => ['attribute', 'reference', 'operation', 'parameter', 'literal'].includes(t),
}));
vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    m2KindOf: () => 'Class',
    checkM2NameUniqueness: () => ({ ok: true }),
}));
vi.mock('../executor', () => ({
    getExecutor: () => ({
        executeAST: async (ast: any, context: any) => {
            if (ast.command === 'eval') return (await import('../commands/eval')).executeEval(ast.args, context);
            if (ast.command === 'let') return (await import('../commands/let')).executeLet(ast.args, context);
            throw new Error(`no dispatch for ${ast.command}`);
        },
    }),
}));

import { parse } from '../../parser/parser';
import { executeCreate } from '../commands/create';
import { executeEval } from '../commands/eval';
import { executeLet } from '../commands/let';
import type { CreateArgs, EvalArgs, ExecutionContext, LetArgs } from '../../types';

// ── a duck-typed L layer: metamodel MM, with or without package P1, classes as given ───────────────────────
function m2(opts: { pkg?: boolean; classes?: string[] } = {}): void {
    const cls = (opts.classes ?? []).map((name, i) => ({
        id: 'c' + i, name, className: 'DClass', father: 'p', abstract: false, attributes: [], references: [], operations: [],
    }));
    const packages = opts.pkg === false ? [] : [{ id: 'p', name: 'P1', className: 'DPackage', classifiers: cls, classes: cls, subpackages: [] }];
    h.metamodel = { id: 'mm', name: 'MM', className: 'DModel', isMetamodel: true, packages, allSubPackages: packages, classes: cls, enumerators: [], instances: [] };
    h.project = { id: 'prj', name: 'P', metamodels: [h.metamodel], models: [] };
}

const ctx = (): ExecutionContext => ({ level: 'M2', variables: new Map(), targetMetamodelId: 'mm' }) as unknown as ExecutionContext;

function ast<T>(src: string, command: string): T {
    const r = parse(src);
    expect(r.success, `${src}: ${r.errors?.map(e => e.message).join(', ')}`).toBe(true);
    expect(r.ast!.command).toBe(command);
    return r.ast!.args as T;
}

const create = (src: string) => executeCreate(ast<CreateArgs>(src, 'create'), ctx());
const evalOf = (src: string) => executeEval(ast<EvalArgs>(src, 'eval'), ctx());
const letOf = (src: string) => executeLet(ast<LetArgs>(src, 'let'), ctx());
const resultOf = (res: any) => res.data?.result;

beforeEach(() => { h.created.length = 0; });

// ── defect 2 ────────────────────────────────────────────────────────────────────────────────────────────────
describe('defect 2: `create class X in P` with no P fails naming P', () => {
    it('no package P9: failure, the message names P9, nothing is created', async () => {
        m2();
        const res = await create('create class Foo in P9');
        expect(res.success, res.message).toBe(false);
        expect(res.message).toContain('P9');
        expect(res.errors?.[0]?.code).toBe('PARENT_NOT_FOUND');
        expect(h.created).toEqual([]);
    });

    it('the same for a package and an enum', async () => {
        m2();
        for (const src of ['create package Q in P9', 'create enum E in P9']) {
            const res = await create(src);
            expect(res.success, `${src}: ${res.message}`).toBe(false);
            expect(res.message).toContain('P9');
        }
        expect(h.created).toEqual([]);
    });

    it('package P1 present: the class is made in P1', async () => {
        m2();
        const res = await create('create class Foo in P1');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'class', name: 'Foo', father: 'p' }]);
    });

    it('`in MM`, the metamodel itself, still places the class there', async () => {
        m2({ pkg: false });
        const res = await create('create class Foo in MM');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'class', name: 'Foo', father: 'mm' }]);
    });

    it('a plain `create class Foo` still works', async () => {
        m2();
        const res = await create('create class Foo');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'class', name: 'Foo', father: 'p' }]);
    });
});

// ── defect 1 ────────────────────────────────────────────────────────────────────────────────────────────────
describe('defect 1: `create package` hands DPackage.new the kind of its father', () => {
    it('default parent is the first package: a subpackage, fatherType DPackage', async () => {
        m2();
        const res = await create('create package P2');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'package', name: 'P2', father: 'p', fatherType: 'DPackage' }]);
    });

    it('a metamodel with no package: a root package, fatherType DModel', async () => {
        m2({ pkg: false });
        const res = await create('create package P1');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'package', name: 'P1', father: 'mm', fatherType: 'DModel' }]);
    });

    it('`in P1` names a package father', async () => {
        m2();
        const res = await create('create package P2 in P1');
        expect(res.success, res.message).toBe(true);
        expect(h.created).toEqual([{ kind: 'package', name: 'P2', father: 'p', fatherType: 'DPackage' }]);
    });
});

// ── defect 3 ────────────────────────────────────────────────────────────────────────────────────────────────
describe('defect 3: `eval` hands JjEL the source text', () => {
    it('the expression is the raw text after `eval`', () => {
        expect(ast<EvalArgs>('eval classes.map(c => c.name)', 'eval').expression).toBe('classes.map(c => c.name)');
        expect(ast<EvalArgs>('eval forall c in classes : c.name + " " + c.id', 'eval').expression)
            .toBe('forall c in classes : c.name + " " + c.id');
        expect(ast<EvalArgs>('eval "a  b".size', 'eval').expression).toBe('"a  b".size');
    });

    it('a lambda evaluates', async () => {
        m2({ classes: ['A', 'B'] });
        const res = await evalOf('eval classes.map(c => c.name)');
        expect(res.success, res.message).toBe(true);
        expect(resultOf(res)).toEqual(['A', 'B']);
    });

    it('a projection with a string literal evaluates', async () => {
        m2({ classes: ['A'] });
        const res = await evalOf('eval forall c in classes : c.name + " " + c.id');
        expect(res.success, res.message).toBe(true);
        expect(resultOf(res)).toEqual(['A c0']);
    });

    it('inside a block the expression still stops before `end`', () => {
        const r = parse('forall c in classes do\n  eval c.name\nend');
        expect(r.success, r.errors?.map(e => e.message).join(', ')).toBe(true);
    });

    it('stops at the end of the line', () => {
        const r = parse('eval 1 + 2\n');
        expect(r.success).toBe(true);
        expect((r.ast!.args as EvalArgs).expression).toBe('1 + 2');
    });
});

// ── defect 4 ────────────────────────────────────────────────────────────────────────────────────────────────
describe('defect 4: a `let` value parses whole, and `$x` reads in `eval`', () => {
    const values = (src: string) => ast<LetArgs>(src, 'let').bindings.map(b => b.valueExpr);

    it('an unparenthesized forall keeps the `in` of its binding', () => {
        expect(values('let $x = forall a in classes : a.name in eval $x')).toEqual(['forall a in classes : a.name']);
    });

    it('two variables, `a, b in S`, stay in the value', () => {
        expect(values('let $x = forall a, b in classes : a.name in eval $x')).toEqual(['forall a, b in classes : a.name']);
    });

    it('two bindings, `a in S, b in T` (R-FA-5), stay in the value', () => {
        expect(values('let $x = forall a in classes, b in classes : a.name in eval $x'))
            .toEqual(['forall a in classes, b in classes : a.name']);
    });

    it('exists, and a second let binding after a quantifier', () => {
        expect(values('let $x = exists a in classes such that a.name == "A", $y = 1 in eval $y'))
            .toEqual(['exists a in classes such that a.name == "A"', '1']);
    });

    it('a call argument after a quantifier is not a binding (R-FA-5)', () => {
        expect(values('let $x = f(forall a in classes, y) in eval $x')).toEqual(['f(forall a in classes, y)']);
    });

    it('`$x` reads in eval: the unparenthesized form', async () => {
        m2({ classes: ['A', 'B'] });
        const res = await letOf('let $x = forall a in classes : a.name in eval $x');
        expect(res.success, res.message).toBe(true);
        expect(resultOf(res)).toEqual(['A', 'B']);
    });

    it('`$x.size` reads in eval: the parenthesized two-variable form', async () => {
        m2({ classes: ['A', 'B'] });
        const res = await letOf('let $x = (forall a, b in classes : a.name) in eval $x.size');
        expect(res.success, res.message).toBe(true);
        expect(resultOf(res)).toBe(4);
    });

    it('a value that does not parse is an error, not a truncation', async () => {
        m2({ classes: ['A'] });
        const res = await letOf('let $x = forall a in in eval $x');
        expect(res.success, res.message).toBe(false);
    });
});
