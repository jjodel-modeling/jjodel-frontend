/**
 * A `forall` body acts on the iterated element, not on its name (R-FA-10, P-2026-11-02-2140).
 *
 * The M2 shells of `buildEvalContext` carry the element's `id`, as M1 instances already did; `forall`
 * writes it on a command's `target` as `elementId`, and the resolvers (`resolvers.ts` at M2,
 * `resolveInstanceTarget` at M1) take the element by id, so homonyms are no longer «ambiguous».
 *
 * Real: the parser, `executeForAll`, `executeRename`, `executeDelete`, `executeSet`, `resolvers.ts`,
 * `buildEvalContext`, JjEL, `resolveInstanceTarget` and the M1 rename handler, `permissionGuard.ts`.
 * Stubbed: the `joiner` barrel (monaco, `window is not defined` under node; the Proxy stub of
 * `unsetDefaultLiteral.test.ts`, with TRANSACTION and SetFieldAction applying to the plain objects),
 * `../utils` (the project), `nameUniqueness` (siblings of one father, reading the plain objects, so a
 * write is visible to the next check), and the executor (dispatch only). `describeForGuard` sits in
 * `executor.ts`, which does not import here: the guard is covered through the two calls it makes,
 * `resolveInstanceTarget` then `instanceType`. Undo is the Run's (`applyAsOneStep`,
 * `redux/reducer/__tests__/undoGroup.test.ts`): `forall` keeps no history, so it is not covered here.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
    project: null as any,
    metamodel: null as any,
    writes: [] as Array<[string, string]>,
    deleted: [] as string[],
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => d, fromPointer: () => null },
        store: { getState: () => ({ m2models: [], idlookup: {} }) },
        Defaults: { primitiveTypeIds: new Set<string>() },
        TRANSACTION: (_name: string, f: () => void) => f(),
        SetFieldAction: { new: (o: any, k: string, v: any) => { h.writes.push([o.id, k]); o[k] = v; } },
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
}));
vi.mock('../../../model/logicWrapper/nameUniqueness', () => ({
    m2KindOf: () => 'Class',
    checkM2NameUniqueness: ({ father, name, excludeId }: any) => {
        const pkg = h.metamodel.packages.find((p: any) => p.id === father);
        const taken = (pkg?.classifiers ?? []).some((c: any) => c.name === name && c.id !== excludeId);
        return taken ? { ok: false, reason: `'${name}' is taken` } : { ok: true };
    },
}));
vi.mock('../executor', () => ({
    getExecutor: () => ({
        executeAST: async (ast: any, context: any) => {
            if (ast.command === 'block') {
                const results = [];
                for (const cmd of ast.args.commands) results.push(await (await import('../executor')).getExecutor().executeAST(cmd, context));
                return { success: results.every(r => r.success), command: 'block', message: 'block', data: { results } };
            }
            if (ast.command === 'forall') return (await import('../commands/forall')).executeForAll(ast.args, context);
            if (ast.command === 'rename') return (await import('../commands/rename')).executeRename(ast.args, context);
            if (ast.command === 'delete') return (await import('../commands/delete')).executeDelete(ast.args, context);
            if (ast.command === 'set') return (await import('../commands/set')).executeSet(ast.args, context);
            throw new Error(`no dispatch for ${ast.command}`);
        },
    }),
}));

import { parse } from '../../parser/parser';
import { executeForAll } from '../commands/forall';
import { executeRename } from '../commands/rename';
import { buildEvalContext } from '../commands/eval';
import { resolveInstanceTarget } from '../commands/instance';
import { resolveTargetInProject, resolveTargetInMetamodel } from '../resolvers';
import { checkCommandPermission, instanceType, type GuardCommand } from '../permissionGuard';
import { jjelEval } from '../../../jjel';
import type { ExecutionContext, ForAllArgs, RenameArgs } from '../../types';

// ── a duck-typed L layer: metamodel MM, package p, classes as given ──────────────────────────────────────
interface ClassSpec { readonly id?: string; readonly name: string; readonly attrs?: ReadonlyArray<{ id?: string; name: string }> }

function element(o: Record<string, any>): any {
    o.delete = () => { h.deleted.push(o.id); };
    return o;
}

function m2(classes: readonly ClassSpec[]): any[] {
    const cls = classes.map(c => element({
        id: c.id, name: c.name, className: 'DClass', father: 'p', abstract: false,
        attributes: (c.attrs ?? []).map(a => element({ id: a.id, name: a.name, className: 'DAttribute', father: c.id })),
        references: [], operations: [],
    }));
    const pkg = { id: 'p', name: 'p', className: 'DPackage', classifiers: cls, classes: cls };
    h.metamodel = { id: 'mm', name: 'MM', className: 'DModel', packages: [pkg], classes: cls, enumerators: [], instances: [] };
    h.project = { id: 'prj', name: 'P', metamodels: [h.metamodel], models: [] };
    return cls;
}

const ctx = (level: 'M1' | 'M2' = 'M2', extra: Record<string, unknown> = {}): ExecutionContext =>
    ({ level, variables: new Map(), ...extra }) as unknown as ExecutionContext;

function forallArgs(src: string): ForAllArgs {
    const r = parse(src);
    expect(r.success, `${src}: ${r.errors?.map(e => e.message).join(', ')}`).toBe(true);
    expect(r.ast!.command).toBe('forall');
    return r.ast!.args as ForAllArgs;
}

const run = (src: string, context = ctx()) => executeForAll(forallArgs(src), context);
const names = (cls: any[]) => cls.map(c => c.name);
const allErrors = (res: any): string[] => (res.errors ?? []).map((e: any) => e.code);

beforeEach(() => { h.writes.length = 0; h.deleted.length = 0; });

// ── the shells ────────────────────────────────────────────────────────────────────────────────────────────
describe('M2 shells carry the element id (R-FA-10)', () => {
    it('class, attribute, reference, operation, package and its classes, enumeration and literal', () => {
        m2([{ id: 'c1', name: 'Foo', attrs: [{ id: 'a1', name: 'x' }] }]);
        const cls = h.metamodel.classes[0];
        cls.references = [{ id: 'r1', name: 'next' }];
        cls.operations = [{ id: 'o1', name: 'run' }];
        h.metamodel.enumerators = [{ id: 'e1', name: 'Mood', literals: [{ id: 'l1', name: 'HAPPY' }] }];
        const v: any = buildEvalContext(ctx());
        expect(v.classes[0].id).toBe('c1');
        expect(v.classes[0].attributes[0].id).toBe('a1');
        expect(v.attributes[0].id).toBe('a1');
        expect(v.references[0].id).toBe('r1');
        expect(v.classes[0].operations[0].id).toBe('o1');
        expect(v.packages[0].id).toBe('p');
        expect(v.packages[0].classes[0].id).toBe('c1');
        expect(v.enumerations[0].id).toBe('e1');
        expect(v.enumerations[0].literals[0].id).toBe('l1');
        expect(jjelEval('classes.first().id', v)).toBe('c1');
    });

    it('an element without an id gets the empty string, as an M1 instance does', () => {
        m2([{ name: 'Foo' }]);
        expect((buildEvalContext(ctx()) as any).classes[0].id).toBe('');
    });

    it('`==` tells two same-shaped classes apart, and an element still equals itself', () => {
        m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const v = buildEvalContext(ctx());
        expect(jjelEval('classes[0] == classes[1]', v)).toBe(false);
        expect(jjelEval('classes[0] == classes[0]', v)).toBe(true);
    });
});

// ── the two duplicates examples ───────────────────────────────────────────────────────────────────────────
describe('the duplicates examples at M2, two classes of one name in one package', () => {
    it('`a.id < b.id` renames exactly one of a pair of identical empty twins', async () => {
        const cls = m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall a, b in classes such that a.name == b.name and a.id < b.id do rename b to b.name + "_dup"');
        expect(res.success, res.message).toBe(true);
        expect(names(cls)).toEqual(['Foo', 'Foo_dup']);
        expect(h.writes).toEqual([]); // rename writes through the setter, never SetFieldAction
    });

    it('the same, when the twins differ in shape', async () => {
        const cls = m2([{ id: 'c1', name: 'Foo', attrs: [{ id: 'a1', name: 'x' }] }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall a, b in classes such that a.name == b.name and a.id < b.id do rename b to b.name + "_dup"');
        expect(res.success, res.message).toBe(true);
        expect(names(cls)).toEqual(['Foo', 'Foo_dup']);
    });

    it('`a != b` matches both orders: the first renames its b, the second is refused as a name conflict', async () => {
        // a = Foo#1: b = Foo#2 passes, Foo#2 becomes Foo_dup. a = Foo#2 is the shell taken before the
        // loop, still named Foo: b = Foo#1 passes again and asks for Foo_dup, which Foo#2 now holds.
        // Here the first write is visible to the uniqueness check; in the app that depends on the
        // commit timer (report F7), and when it is not, both classes end up Foo_dup.
        const cls = m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"');
        expect(res.success).toBe(false);
        expect(allErrors(res)).toEqual(['NAME_CONFLICT']);
        expect(names(cls)).toEqual(['Foo', 'Foo_dup']);
        const inner = (res.data as any).results.map((r: any) => r.data.successCount);
        expect(inner).toEqual([1, 0]);
    });
});

// ── delete and set through the variable on a duplicate ───────────────────────────────────────────────────
describe('delete and set through the variable', () => {
    it('`delete c` on twins deletes each one, by id', async () => {
        m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall c in classes do delete c');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(h.deleted).toEqual(['c1', 'c2']);
    });

    it('`delete c` on the twin the filter picks deletes that one only', async () => {
        m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo', attrs: [{ id: 'a2', name: 'x' }] }]);
        const res = await run('forall c in classes such that c.attributeCount > 0 do delete c');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(h.deleted).toEqual(['c2']);
    });

    it('`set c.abstract = true` writes on the twin the filter picks', async () => {
        const cls = m2([{ id: 'c1', name: 'Foo', attrs: [{ id: 'a1', name: 'x' }] }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall c in classes such that c.attributeCount > 0 do set c.abstract = true');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(h.writes.map(([id]) => id)).toEqual(['c1']);
        expect(cls.map(c => c.abstract)).toEqual([true, false]);
    });
});

// ── a member through the variable ─────────────────────────────────────────────────────────────────────────
describe('a member named through the variable', () => {
    const twinsWithX = () => m2([
        { id: 'c1', name: 'Foo', attrs: [{ id: 'a1', name: 'x' }, { id: 'a1b', name: 'y' }] },
        { id: 'c2', name: 'Foo', attrs: [{ id: 'a2', name: 'x' }] },
    ]);

    it('`delete c.x` deletes the member of that element (it used to look up a class named c)', async () => {
        twinsWithX();
        const res = await run('forall c in classes such that c.attributeCount > 1 do delete c.x');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(h.deleted).toEqual(['a1']);
    });

    it('`delete c::x` and `delete attribute x in c` do the same', async () => {
        twinsWithX();
        expect((await run('forall c in classes such that c.attributeCount > 1 do delete c::x')).success).toBe(true);
        expect((await run('forall c in classes such that c.attributeCount == 1 do delete attribute x in c')).success).toBe(true);
        expect(h.deleted).toEqual(['a1', 'a2']);
    });

    it('a member the element lacks is a missing member on THAT element, not on its twin', async () => {
        twinsWithX();
        const res = await run('forall c in classes such that c.attributeCount == 1 do delete c.y');
        expect(allErrors(res)).toEqual(['MEMBER_NOT_FOUND']);
        expect(h.deleted).toEqual([]);
    });

    it('nested: an outer element named like the inner variable stays the outer element', async () => {
        // `a` becomes the class named `b`; the inner level must not read that target as its own `b`.
        const cls = m2([{ id: 'c1', name: 'b' }, { id: 'c2', name: 'Foo' }]);
        const res = await run('forall a, b in classes such that a.name == "b" and b.name == "Foo" do rename a to Zed');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(names(cls)).toEqual(['Zed', 'Foo']);
    });

    it('nested: `forall c in classes, x in c.attributes do delete x` reaches every attribute, homonyms included', async () => {
        twinsWithX();
        const res = await run('forall c in classes, x in c.attributes such that x.name == "x" do delete x');
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect(h.deleted).toEqual(['a1', 'a2']);
    });
});

// ── what keeps today's behaviour ──────────────────────────────────────────────────────────────────────────
describe('today\'s behaviour where there is no identity, or no homonym', () => {
    it('strings in the collection are names: a unique one resolves, a shared one is ambiguous', async () => {
        const cls = m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }, { id: 'c3', name: 'Bar' }]);
        expect((await run('forall n in ["Bar"] do rename n to Baz')).success).toBe(true);
        const shared = await run('forall n in ["Foo"] do rename n to Qux');
        expect(allErrors(shared)).toEqual(['AMBIGUOUS_TARGET']);
        expect(names(cls)).toEqual(['Foo', 'Foo', 'Baz']);
    });

    it('a unique name: the same message as the plain command', async () => {
        m2([{ id: 'c1', name: 'Foo' }]);
        const viaForall = await run('forall c in classes do rename c to Bar');
        const inner = (viaForall.data as any).results[0];
        m2([{ id: 'c1', name: 'Foo' }]);
        const direct = await executeRename(parse('rename Foo to Bar').ast!.args as RenameArgs, ctx());
        expect(inner.message).toBe(direct.message);
        expect(inner.success).toBe(true);
    });

    it('a unique name whose element is gone: the same «not found» as the plain command', async () => {
        m2([{ id: 'c1', name: 'Foo' }]);
        const res = await run('forall c in classes do do delete c; rename c to Bar end');
        const block = (res.data as any).results[0];
        expect(block.success).toBe(true);
        h.metamodel.packages[0].classifiers = []; h.metamodel.packages[0].classes = []; h.metamodel.classes = [];
        const gone = await run('forall c in ["Foo"] do rename c to Bar');
        expect(allErrors(gone)).toEqual(['ELEMENT_NOT_FOUND']);
    });

    it('an element shell without an id resolves by name, as before', async () => {
        const cls = m2([{ name: 'Foo' }]);
        expect((await run('forall c in classes do rename c to Bar')).success).toBe(true);
        expect(names(cls)).toEqual(['Bar']);
    });
});

// ── the resolvers on an id ────────────────────────────────────────────────────────────────────────────────
describe('the resolvers on a target that carries elementId', () => {
    it('take the element by id, in the project and in the metamodel, past a homonym', () => {
        const cls = m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const target = { segments: ['Foo'], raw: 'Foo', elementId: 'c2' };
        expect(resolveTargetInProject(target, h.project).element).toBe(cls[1]);
        expect(resolveTargetInMetamodel(target, h.metamodel).element).toBe(cls[1]);
        expect(resolveTargetInProject({ segments: ['Foo'], raw: 'Foo' }, h.project).ambiguousWith).toHaveLength(2);
    });

    it('an id not found is a miss, never the homonym of the same name', () => {
        m2([{ id: 'c1', name: 'Foo' }, { id: 'c2', name: 'Foo' }]);
        const r = resolveTargetInProject({ segments: ['Foo'], raw: 'Foo', elementId: 'gone' }, h.project);
        expect(r).toEqual({ element: null });
    });

    it('the kind restriction still applies to the element found by id', () => {
        m2([{ id: 'c1', name: 'Foo' }]);
        const r = resolveTargetInProject({ segments: ['Foo'], raw: 'Foo', elementId: 'c1' }, h.project, ['enum']);
        expect(r.element).toBeNull();
    });
});

// ── M1 ────────────────────────────────────────────────────────────────────────────────────────────────────
describe('M1 instances with one name', () => {
    function m1() {
        m2([{ id: 'cCourse', name: 'Course' }, { id: 'cComp', name: 'Competency' }]);
        const [course, comp] = h.metamodel.classes;
        const o1 = { id: 'o1', name: 'x', className: 'DObject', instanceof: course, features: [] as any[] };
        const o2 = { id: 'o2', name: 'x', className: 'DObject', instanceof: comp, features: [] as any[] };
        const model = { id: 'm1', name: 'M', isMetamodel: false, objects: [o1, o2] };
        h.metamodel.instances = [model];
        h.project.models = [model];
        return { model, o1, o2 };
    }
    const m1ctx = () => ctx('M1', { modelId: 'm1', targetMetamodelId: 'mm' });

    it('`rename o` renames each homonym instance, by id', async () => {
        const { o1, o2 } = m1();
        const res = await run('forall o in instances do rename o to o.name + "_" + o.id', m1ctx());
        expect(res.success, JSON.stringify(res.errors)).toBe(true);
        expect([o1.name, o2.name]).toEqual(['x_o1', 'x_o2']);
        expect(h.writes).toEqual([['o1', 'name'], ['o1', 'initialName'], ['o2', 'name'], ['o2', 'initialName']]);
    });

    it('resolveInstanceTarget: by id among homonyms, a missing id is a miss, no id is the name as before', () => {
        const { model, o2 } = m1();
        expect(resolveInstanceTarget(model as any, { segments: ['x'], raw: 'x', elementId: 'o2' }).value).toBe(o2);
        const miss = resolveInstanceTarget(model as any, { segments: ['x'], raw: 'x', elementId: 'gone' });
        expect(miss.ok).toBe(false);
        expect(miss.candidates).toBeUndefined();
        expect(resolveInstanceTarget(model as any, { segments: ['x'], raw: 'x' }).candidates).toHaveLength(2);
    });

    it('the permission guard judges the element the handler writes: allow on one homonym, deny on the other', () => {
        const { model } = m1();
        const env = { profileId: 'pr', profile: { id: 'pr', className: 'DProfile', typePermissions: { cCourse: 'edit', cComp: 'read' } } };
        const subject = (elementId?: string) => instanceType(
            resolveInstanceTarget(model as any, { segments: ['x'], raw: 'x', ...(elementId ? { elementId } : {}) }), 'x', new Map());
        const verdict = (elementId?: string) =>
            checkCommandPermission({ command: 'rename', level: 'M1', subject: subject(elementId) } as GuardCommand, env)?.code ?? null;
        expect(verdict('o1')).toBeNull();
        expect(verdict('o2')).toBe('PROFILE_TYPE_LOCKED');
        expect(verdict()).not.toBeNull(); // the bare name is ambiguous, refused as before
    });
});

// ── the id is never written back nor kept ────────────────────────────────────────────────────────────────
describe('the id is a reading, not a write', () => {
    it('no element gains an id or an elementId, and the parsed script keeps no elementId', async () => {
        const cls = m2([{ id: 'c1', name: 'Foo', attrs: [{ id: 'a1', name: 'x' }] }, { id: 'c2', name: 'Foo' }]);
        const before = cls.map(c => Object.keys(c).sort());
        const args = forallArgs('forall a, b in classes such that a.name == b.name and a.id < b.id do rename b to b.name + "_dup"');
        const pristine = JSON.stringify(args);
        const res = await executeForAll(args, ctx());
        expect(res.success).toBe(true);
        expect(cls.map(c => Object.keys(c).sort())).toEqual(before);
        expect(JSON.stringify(args)).toBe(pristine);
        expect(pristine).not.toContain('elementId');
        expect(JSON.stringify(h.project, (_k, v) => (typeof v === 'function' ? undefined : v))).not.toContain('elementId');
        expect(h.writes).toEqual([]);
    });

    it('an M1 rename writes the name, never the id', async () => {
        m2([{ id: 'c', name: 'C' }]);
        const o = { id: 'o1', name: 'x', className: 'DObject', instanceof: h.metamodel.classes[0], features: [] as any[] };
        const model = { id: 'm1', name: 'M', isMetamodel: false, objects: [o] };
        h.metamodel.instances = [model]; h.project.models = [model];
        await run('forall o in instances do rename o to "y"', ctx('M1', { modelId: 'm1', targetMetamodelId: 'mm' }));
        expect(h.writes.map(([, k]) => k)).toEqual(['name', 'initialName']);
        expect(o.id).toBe('o1');
    });
});
