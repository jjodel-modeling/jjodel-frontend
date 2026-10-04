/**
 * R-JS-3 — Run executes in passes, and defers only what is safe to run again.
 *
 * `execOne` here is a small interpreter over an in-memory model, so the passes act on a state
 * that the commands really change: a forward reference resolves only because the line that
 * creates its target ran. The commands are parsed by the real parser inside `isDeferrable`,
 * and their error codes are the executor's own (`discovery_2026-10-01_jjscript_requeue.md` §3.2).
 */
import { describe, it, expect } from 'vitest';
import {
    runPasses,
    isDeferrable,
    findSupersedingSet,
    DEFERRABLE_ERROR_CODES,
    M1_DEFERRABLE_ERROR_CODES,
    MAX_RETRY_PASSES,
    type PassResult,
} from '../runPasses';

interface FakeResult extends PassResult {
    command: string;
    message: string;
    errors?: Array<{ code: string; message: string }>;
}

interface FakeClass { superclass?: string; attrs: string[]; values: Record<string, string | string[]> }

/** A model of classes, enough for create/extends/attribute/set/delete. */
function fakeModel(commands: string[]) {
    const classes = new Map<string, FakeClass>();
    const calls: number[] = [];
    const ok = (command: string): FakeResult => ({ command, success: true, message: 'ok' });
    const ko = (command: string, code: string): FakeResult =>
        ({ command, success: false, message: code, errors: [{ code, message: code }] });

    async function execOne(i: number): Promise<FakeResult> {
        calls.push(i);
        const c = commands[i];
        let m: RegExpMatchArray | null;
        if ((m = c.match(/^create class (\w+)(?: extends (\w+))?$/))) {
            if (classes.has(m[1])) return ko(c, 'DUPLICATE_NAME');
            if (m[2] && !classes.has(m[2])) return ko(c, 'PARENT_NOT_FOUND');
            classes.set(m[1], { superclass: m[2], attrs: [], values: {} });
            return ok(c);
        }
        if ((m = c.match(/^create attribute (\w+) in (\w+)$/))) {
            const owner = classes.get(m[2]);
            if (!owner) return ko(c, 'PARENT_NOT_FOUND');
            owner.attrs.push(m[1]);
            return ok(c);
        }
        if ((m = c.match(/^set (\w+)\.(\w+) (=|\+=) "(\w*)"$/))) {
            const target = classes.get(m[1]);
            if (!target) return ko(c, 'ELEMENT_NOT_FOUND');
            if (m[3] === '+=') target.values[m[2]] = [...((target.values[m[2]] as string[]) ?? []), m[4]];
            else target.values[m[2]] = m[4];
            return ok(c);
        }
        if ((m = c.match(/^delete class (\w+)$/))) {
            if (!classes.delete(m[1])) return ko(c, 'ELEMENT_NOT_FOUND');
            return ok(c);
        }
        return ko(c, 'OPERATION_FAILED');
    }
    return { classes, calls, execOne };
}

async function run(commands: string[], options = {}) {
    const model = fakeModel(commands);
    const result = await runPasses<FakeResult>(commands, model.execOne, isDeferrable, options);
    return { ...model, ...result };
}

const byIndex = <T extends { index: number }>(outcomes: T[], i: number): T => outcomes.find(o => o.index === i)!;

describe('runPasses — R-JS-3', () => {
    it('resolves a forward reference on pass 2', async () => {
        const r = await run(['create attribute a in Node', 'create class Node']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'success', pass: 2, attempts: 2 });
        expect(byIndex(r.outcomes, 1)).toMatchObject({ status: 'success', pass: 1, attempts: 1 });
        expect(r.classes.get('Node')!.attrs).toEqual(['a']);
        expect(r.passes).toBe(2);
    });

    it('resolves a chain of two forward references on pass 3', async () => {
        const r = await run(['create class A extends B', 'create class B extends C', 'create class C']);
        expect(r.outcomes.map(o => [o.status, o.pass])).toEqual([['success', 3], ['success', 2], ['success', 1]]);
        expect(r.classes.get('A')!.superclass).toBe('B');
    });

    it('makes a non-deferrable error final at once and continues the run', async () => {
        const r = await run(['create class A', 'create class A', 'create class B']);
        expect(byIndex(r.outcomes, 1)).toMatchObject({ status: 'failed', attempts: 1, pass: 1 });
        expect(byIndex(r.outcomes, 1).result.errors![0].code).toBe('DUPLICATE_NAME');
        expect(byIndex(r.outcomes, 2)).toMatchObject({ status: 'success', pass: 1 });
        expect(r.calls).toEqual([0, 1, 2]);
        expect(r.passes).toBe(1);
    });

    it('ends the loop after a pass that resolves nothing', async () => {
        const r = await run(['create attribute a in Ghost', 'create class B']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'failed', attempts: 2, pass: 2 });
        expect(r.passes).toBe(2);
    });

    it('does not retry when the first pass resolved nothing', async () => {
        const r = await run(['create attribute a in Ghost']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'failed', attempts: 1 });
        expect(r.passes).toBe(1);
    });

    it('stops at three retry passes after the first, with the error of the last attempt', async () => {
        const chain = [
            'create class A extends B', 'create class B extends C', 'create class C extends D',
            'create class D extends E', 'create class E extends F', 'create class F',
        ];
        const r = await run(chain);
        expect(MAX_RETRY_PASSES).toBe(3);
        expect(r.passes).toBe(1 + MAX_RETRY_PASSES);
        expect(r.outcomes.map(o => o.status)).toEqual(['failed', 'failed', 'success', 'success', 'success', 'success']);
        expect(r.outcomes.map(o => o.pass)).toEqual([4, 4, 4, 3, 2, 1]);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ attempts: 4 });
        expect(byIndex(r.outcomes, 0).result.errors![0].code).toBe('PARENT_NOT_FOUND');
    });

    it('never defers a failing delete', async () => {
        const r = await run(['delete class X', 'create class X']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'failed', attempts: 1 });
        expect(r.classes.has('X')).toBe(true);
        expect(r.calls).toEqual([0, 1]);
    });

    it('returns the final results ordered by line, whatever the order they settled in', async () => {
        const r = await run(['create class A extends B', 'create class B extends C', 'create class C', 'create class A']);
        expect(r.outcomes.map(o => o.index)).toEqual([0, 1, 2, 3]);
    });

    it('supersedes a deferred set by a later succeeded set of the same feature (lines 3, 5, 6 end with "b")', async () => {
        const commands = [
            'create class P', 'create class Q',
            'set N.p = "a"',        // line 3: N does not exist yet
            'create class R',
            'create class N',       // line 5
            'set N.p = "b"',        // line 6: succeeds on pass 1
        ];
        const r = await run(commands);
        expect(r.classes.get('N')!.values.p).toBe('b');
        expect(byIndex(r.outcomes, 2)).toMatchObject({ status: 'superseded', supersededBy: 5, attempts: 1 });
        expect(r.outcomes.filter(o => o.status === 'failed')).toEqual([]);
    });

    it('retries a deferred set when the later set of the same feature has not succeeded', async () => {
        const r = await run(['set N.p = "a"', 'set N.p = "c"', 'create class N']);
        expect(r.outcomes.map(o => o.status)).toEqual(['success', 'success', 'success']);
        expect(r.classes.get('N')!.values.p).toBe('c');
    });

    it('does not supersede across features or targets', async () => {
        const r = await run(['set N.p = "a"', 'create class N', 'create class M', 'set N.q = "b"', 'set M.p = "c"']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'success', pass: 2 });
        expect(r.classes.get('N')!.values).toEqual({ p: 'a', q: 'b' });
    });

    it('lets two collection updates of the same feature compose instead of superseding', async () => {
        const r = await run(['set N.items += "a"', 'create class N', 'set N.items += "b"']);
        expect(byIndex(r.outcomes, 0)).toMatchObject({ status: 'success', pass: 2 });
        expect(r.classes.get('N')!.values.items).toEqual(['b', 'a']);
    });

    it('runs only the given indices, in line order (the rerun of the final failures)', async () => {
        const commands = ['create class A', 'create attribute x in Z', 'create class Z', 'create attribute y in Z'];
        const model = fakeModel(commands);
        await model.execOne(2);
        const r = await runPasses<FakeResult>(commands, model.execOne, isDeferrable, { indices: [3, 1] });
        expect(r.outcomes.map(o => [o.index, o.status])).toEqual([[1, 'success'], [3, 'success']]);
        expect(model.calls).toEqual([2, 1, 3]);
    });

    it('stops between commands when asked, and says so', async () => {
        let stop = false;
        const commands = ['create class A', 'create class B', 'create class C'];
        const model = fakeModel(commands);
        const r = await runPasses<FakeResult>(commands, async (i: number) => { const res = await model.execOne(i); stop = i === 1; return res; },
            isDeferrable, { shouldStop: () => stop });
        expect(r.stopped).toBe(true);
        expect(model.calls).toEqual([0, 1]);
    });
});

describe('isDeferrable — the R-JS-3 conditions', () => {
    const failed = (code: string) => ({ success: false, errors: [{ code }] });

    it('defers exactly the twelve unresolved-name codes of the report, on a constructive verb', () => {
        expect([...DEFERRABLE_ERROR_CODES].sort()).toEqual([
            'AMBIGUOUS_OUT_OF_SCOPE', 'CHILD_NOT_FOUND', 'ELEMENT_NOT_FOUND', 'MEMBER_NOT_FOUND',
            'NO_PARENT', 'OUT_OF_SCOPE', 'PARENT_NOT_FOUND', 'UNKNOWN_ATTRIBUTE_TYPE',
            'UNKNOWN_OPERATION_TYPE', 'UNKNOWN_PARAMETER_TYPE', 'UNKNOWN_REFERENCE_TYPE', 'UNKNOWN_TYPE',
        ]);
        for (const code of DEFERRABLE_ERROR_CODES) {
            expect(isDeferrable('create attribute a in X', failed(code))).toBe(true);
        }
    });

    it('does not defer any other code, the mapped OPERATION_FAILED and the dead TARGET_NOT_FOUND included', () => {
        for (const code of ['OPERATION_FAILED', 'DUPLICATE_NAME', 'AMBIGUOUS_PARENT', 'AMBIGUOUS_TYPE',
            'TARGET_NOT_FOUND', 'CREATE_CLASS_ERROR', 'EXECUTION_ERROR', 'SCOPE_NOT_FOUND', 'PARSE_ERROR']) {
            expect(isDeferrable('create attribute a in X', failed(code))).toBe(false);
        }
    });

    it('defers create, add, set and the standalone extends', () => {
        for (const cmd of ['create class A extends B', 'add attribute x to Node', 'set N.p = "a"', 'A extends B']) {
            expect(isDeferrable(cmd, failed('PARENT_NOT_FOUND'))).toBe(true);
        }
    });

    it('never defers a destructive, toggling or opaque command', () => {
        for (const cmd of ['delete class N', 'rename N to M', 'move N to P', 'copy N to P', 'remove x from N',
            'abstract N', 'foo bar baz', 'let x = 3']) {
            expect(isDeferrable(cmd, failed('ELEMENT_NOT_FOUND'))).toBe(false);
        }
    });

    it('does not defer a success, nor a failure that carries no executor code', () => {
        expect(isDeferrable('create attribute a in X', { success: true })).toBe(false);
        expect(isDeferrable('create attribute a in X', { success: false })).toBe(false);
    });
});

describe('findSupersedingSet', () => {
    const commands = ['set N.p = "a"', 'create class N', 'set N.p = "b"', 'set N.p += "c"'];

    it('names the nearest later succeeded set of the same target and feature', () => {
        expect(findSupersedingSet(commands, 0, new Set([1, 2, 3]))).toBe(2);
    });

    it('ignores a later set that has not succeeded, and earlier lines', () => {
        expect(findSupersedingSet(commands, 0, new Set([1]))).toBeUndefined();
        expect(findSupersedingSet(commands, 2, new Set([0, 1]))).toBeUndefined();
    });

    it('answers only for a set command', () => {
        expect(findSupersedingSet(commands, 1, new Set([2, 3]))).toBeUndefined();
    });
});

describe('isDeferrable — M1 (R-JS-8)', () => {
    const failed = (code: string) => ({ success: false, errors: [{ code }] });

    it('defers exactly the two M1 codes, kept apart from the twelve M2 ones', () => {
        expect([...M1_DEFERRABLE_ERROR_CODES].sort()).toEqual(['CONTAINER_NOT_READY', 'INSTANCE_NOT_FOUND']);
        for (const code of M1_DEFERRABLE_ERROR_CODES) expect(DEFERRABLE_ERROR_CODES.has(code)).toBe(false);
    });

    it('defers a set naming an instance a later line creates, as target or as value', () => {
        expect(isDeferrable('set tStart.event = evStart', failed('INSTANCE_NOT_FOUND'))).toBe(true);
        expect(isDeferrable('set idle.transitions += tStart', failed('INSTANCE_NOT_FOUND'))).toBe(true);
    });

    it('defers a create inside a container that is missing or not ready yet', () => {
        expect(isDeferrable('create instance of Transition "t" in idle.transitions', failed('INSTANCE_NOT_FOUND'))).toBe(true);
        expect(isDeferrable('create instance of Transition "t" in idle.transitions', failed('CONTAINER_NOT_READY'))).toBe(true);
    });

    it('never defers a destructive verb on a missing instance', () => {
        for (const cmd of ['delete instance x', 'rename instance x to y', 'delete x']) {
            expect(isDeferrable(cmd, failed('INSTANCE_NOT_FOUND'))).toBe(false);
        }
    });

    it('keeps final the M1 codes that a later line cannot fix', () => {
        for (const code of ['AMBIGUOUS_INSTANCE', 'CLASS_NOT_FOUND', 'NO_METACLASS', 'UNKNOWN_PROPERTY', 'TYPE_MISMATCH',
            'NOT_A_CONTAINMENT', 'MULTIPLICITY_EXCEEDED', 'HANDLE_IN_USE', 'WRONG_LEVEL']) {
            expect(isDeferrable('create instance of Transition "t" in idle.transitions', failed(code))).toBe(false);
            expect(isDeferrable('set t.event = e', failed(code))).toBe(false);
        }
    });

    it('a forward instance reference completes on a later pass', async () => {
        // The microwave of the discovery report, reduced: the containment and the event lines
        // name instances that later lines create.
        const commands = [
            'create instance of State "idle"',
            'set idle.transitions += tStart',
            'create instance of Transition "tStart"',
            'set tStart.event = evStart',
            'create instance of Event "evStart"',
        ];
        const made = new Set<string>();
        const links: string[] = [];
        const execOne = async (i: number) => {
            const c = commands[i];
            let m: RegExpMatchArray | null;
            if ((m = c.match(/^create instance of \w+ "(\w+)"$/))) { made.add(m[1]); return { command: c, success: true }; }
            if ((m = c.match(/^set (\w+)\.(\w+) \+?= (\w+)$/))) {
                if (!made.has(m[1]) || !made.has(m[3])) return { command: c, success: false, errors: [{ code: 'INSTANCE_NOT_FOUND' }] };
                links.push(`${m[1]}.${m[2]}=${m[3]}`);
                return { command: c, success: true };
            }
            return { command: c, success: false, errors: [{ code: 'OPERATION_FAILED' }] };
        };
        const r = await runPasses(commands, execOne, isDeferrable);
        expect(r.outcomes.every(o => o.status === 'success')).toBe(true);
        expect(r.outcomes.filter(o => o.pass === 2).map(o => o.index)).toEqual([1, 3]);
        expect(links).toEqual(['idle.transitions=tStart', 'tStart.event=evStart']);
    });
});
