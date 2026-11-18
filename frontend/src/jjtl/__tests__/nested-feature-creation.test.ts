import { describe, it, expect, vi } from 'vitest';

/**
 * `-> feature { ... }` written INSIDE an object created by a rule or a forall,
 * with the variables of every enclosing forall still bound.
 *
 * Before the fix, an attribute mapping carrying an objectCreation inside a created
 * object went through the wrapper path: `-> deps { forall ... -> Link {...} }` built
 * an object typed `deps` with pluralized sub-lists instead of placing the created
 * Links into the feature `deps`, and the forall variables of the outer level were
 * not visible one level down.
 *
 * The joiner barrel is mocked (see executor/__tests__/contained-sources.test.ts for
 * why: it drags in monaco, which reads `window` at import); the executor itself
 * runs unstubbed.
 */
vi.mock('../../joiner', () => ({
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

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import { execute } from '../executor/executor';
import type { TransformationAST } from '../types/ast';

function parseJjtl(source: string): TransformationAST {
    const { tokens } = new JjtlLexer(source.trim()).tokenize();
    const { ast, errors } = new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const TRANSFORMATION = `transformation Team2Plan
from Team
to Plan

Team -> Plan {
    name := name
    -> tasks {
        forall m in members -> Task {
            name := "task_" + m.name
            -> deps {
                forall o in members such that o.rank < m.rank -> Link {
                    name := m.name + "_after_" + o.name
                    -> via {
                        -> Link { name := "via_" + m.name }
                    }
                }
            }
            -> owner {
                -> Link { name := "own_" + m.name }
            }
        }
    }
}
`;

const PLAN_MM = {
    classes: [
        {
            className: 'DClass', name: 'Plan',
            allAttributes: [{ name: 'name' }],
            allReferences: [{ name: 'tasks', composition: true, type: { name: 'Task' } }],
        },
        {
            className: 'DClass', name: 'Task',
            allAttributes: [{ name: 'name' }],
            allReferences: [
                { name: 'deps', composition: true, type: { name: 'Link' } },
                { name: 'owner', composition: true, type: { name: 'Link' } },
            ],
        },
        {
            className: 'DClass', name: 'Link',
            allAttributes: [{ name: 'name' }],
            allReferences: [{ name: 'via', composition: true, type: { name: 'Link' } }],
        },
    ],
};

const SOURCE = [
    { id: 'T1', name: 't', className: 'Team', __type: 'Team', members: [{ __ref: 'M1' }, { __ref: 'M2' }, { __ref: 'M3' }] },
    { id: 'M1', name: 'a', className: 'Member', __type: 'Member', rank: 1 },
    { id: 'M2', name: 'b', className: 'Member', __type: 'Member', rank: 2 },
    { id: 'M3', name: 'c', className: 'Member', __type: 'Member', rank: 3 },
];

const FEATURE_NAMES = ['deps', 'via', 'owner'];

/** Every object reachable from a value, to look for wrapper objects typed after a feature. */
function walk(value: any, out: any[] = []): any[] {
    if (Array.isArray(value)) { value.forEach(v => walk(v, out)); return out; }
    if (value && typeof value === 'object') {
        out.push(value);
        Object.values(value).forEach(v => walk(v, out));
    }
    return out;
}

describe('-> feature { ... } inside a created object', () => {
    const run = () => execute(parseJjtl(TRANSFORMATION), SOURCE, PLAN_MM);
    // Nested objects are not registered in `instances`: they live in the feature of the object that owns them.
    const tasksOf = (result: Awaited<ReturnType<typeof run>>): any[] => result.targetModel!.roots[0].tasks;

    it('creates one Task per member', async () => {
        const result = await run();
        expect(result.success).toBe(true);
        const tasks = tasksOf(result);
        expect(tasks.map((t: any) => t.name).sort()).toEqual(['task_a', 'task_b', 'task_c']);
    });

    it('leaves deps empty for the lowest-ranked member', async () => {
        const result = await run();
        const taskA = tasksOf(result).find((t: any) => t.name === 'task_a');
        expect(taskA.deps || []).toHaveLength(0);
    });

    it('puts into deps one Link per lower-ranked member, with the outer forall variable bound', async () => {
        const result = await run();
        const taskC = tasksOf(result).find((t: any) => t.name === 'task_c');
        expect(Array.isArray(taskC.deps)).toBe(true);
        expect(taskC.deps).toHaveLength(2);
        expect(taskC.deps.every((l: any) => l.__type === 'Link')).toBe(true);
        expect(taskC.deps.map((l: any) => l.name).sort()).toEqual(['c_after_a', 'c_after_b']);
    });

    it('puts into via one Link named after the outer forall variable', async () => {
        const result = await run();
        const taskC = tasksOf(result).find((t: any) => t.name === 'task_c');
        for (const link of taskC.deps) {
            expect(Array.isArray(link.via)).toBe(false);
            expect(link.via.__type).toBe('Link');
            expect(link.via.name).toBe('via_c');
        }
    });

    it('puts into owner one Link per Task', async () => {
        const result = await run();
        const tasks = tasksOf(result);
        expect(tasks).toHaveLength(3);
        for (const task of tasks) {
            const member = task.name.replace('task_', '');
            expect(Array.isArray(task.owner)).toBe(false);
            expect(task.owner.__type).toBe('Link');
            expect(task.owner.name).toBe(`own_${member}`);
        }
    });

    it('builds no object typed after a feature name', async () => {
        const result = await run();
        const types = [...result.targetModel!.instances.keys()];
        for (const feature of FEATURE_NAMES) {
            expect(types).not.toContain(feature);
        }
        const plan = result.targetModel!.instances.get('Plan')![0];
        const offenders = walk(plan).filter(o => FEATURE_NAMES.includes(o.__type) || FEATURE_NAMES.includes(o.className));
        expect(offenders).toEqual([]);
    });

    it('reports no warning', async () => {
        const result = await run();
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([]);
    });
});
