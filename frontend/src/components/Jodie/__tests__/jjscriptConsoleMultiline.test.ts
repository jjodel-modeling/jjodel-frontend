/**
 * JjScript console, an input with several commands: each line runs, in order, up to the first
 * failure, and the lines after it are named, not dropped in silence.
 *
 * The jjscript barrel does not import in the bench (`window is not defined`), so it is mocked:
 * `execute` records what it is given and fails on a command that contains FAIL or THROW. The
 * grouping mock keeps a `... do` / `end` span together, the way `groupBlockCommands` does, so
 * the test shows that the provider runs what the grouper returns, one command per entry. The
 * real `groupBlockCommands` is not exercised here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const executed: string[] = [];

vi.mock('../../../jjscript', () => ({
    JjScriptService: {
        execute: vi.fn(async (input: string) => {
            executed.push(input);
            if (input.includes('THROW')) throw new Error('boom');
            return { success: !input.includes('FAIL'), command: input.split(/\s+/)[0] };
        }),
        formatResultForChat: (r: { success: boolean; command: string }) => `${r.success ? 'ok' : 'ko'} ${r.command}`,
    },
    parse: () => ({ success: true }),
}));

vi.mock('../../../jjscript/executor/executor', () => ({
    groupBlockCommands: (lines: string[]) => {
        const out: string[] = [];
        let block: string[] | null = null;
        for (const line of lines) {
            const l = line.trim().toLowerCase();
            if (block === null && l.endsWith(' do')) { block = [line]; continue; }
            if (block !== null) {
                block.push(line);
                if (l === 'end') { out.push(block.join('\n')); block = null; }
                continue;
            }
            out.push(line);
        }
        if (block !== null) out.push(block.join('\n'));
        return out;
    },
}));

import { jjscriptProvider, consoleCommands } from '../console/providers/jjscriptProvider';

let n = 0;
const ctx = { makeId: () => `id${n++}` };

beforeEach(() => { executed.length = 0; n = 0; });

describe('consoleCommands', () => {
    it('one command per line, blank and comment lines dropped', () => {
        const input = '# add two attributes\n\ncreate attribute nome in Persona type String\n// note\n  create attribute cognome in Persona type String  \n';
        expect(consoleCommands(input)).toEqual([
            'create attribute nome in Persona type String',
            'create attribute cognome in Persona type String',
        ]);
    });

    it('keeps what the grouper joins as one command', () => {
        expect(consoleCommands('forall c in classes do\n  set c.abstract = false\nend\ncreate class B')).toEqual([
            'forall c in classes do\n  set c.abstract = false\nend',
            'create class B',
        ]);
    });
});

describe('jjscriptProvider.run', () => {
    it('runs every line of a multi-line input, one entry each', async () => {
        const { entries } = await jjscriptProvider.run('create attribute nome in Persona type String\ncreate attribute cognome in Persona type String', ctx);
        expect(executed).toEqual([
            'create attribute nome in Persona type String',
            'create attribute cognome in Persona type String',
        ]);
        expect(entries.map(e => (e as any).jjscriptResult.input)).toEqual(executed);
        expect(entries.every(e => (e as any).jjscriptResult.success)).toBe(true);
    });

    it('stops at the first failure and names the commands not run', async () => {
        const { entries } = await jjscriptProvider.run('create class A\ncreate FAIL\ncreate class C\ncreate class D', ctx);
        expect(executed).toEqual(['create class A', 'create FAIL']);
        expect(entries).toHaveLength(3);
        const last = entries[2] as any;
        expect(last.jjscriptResult).toEqual({ success: false, command: 'not-run', input: 'create class C\ncreate class D' });
        expect(last.content).toContain('2 commands were not run');
    });

    it('a thrown command keeps the earlier results and stops', async () => {
        const { entries } = await jjscriptProvider.run('create class A\ncreate THROW\ncreate class C', ctx);
        expect(executed).toEqual(['create class A', 'create THROW']);
        expect((entries[0] as any).jjscriptResult.success).toBe(true);
        expect((entries[1] as any).content).toBe('**JjScript Error:** boom');
        expect((entries[2] as any).jjscriptResult.command).toBe('not-run');
    });

    it('a failing last command adds no not-run note', async () => {
        const { entries } = await jjscriptProvider.run('create class A\ncreate FAIL', ctx);
        expect(entries).toHaveLength(2);
    });

    it('one command goes to the executor as typed, comments and all', async () => {
        const input = '# one\ncreate class A\n';
        const { entries } = await jjscriptProvider.run(input, ctx);
        expect(executed).toEqual([input]);
        expect(entries).toHaveLength(1);
    });

    it('a single command still throws to the handler', async () => {
        await expect(jjscriptProvider.run('create THROW', ctx)).rejects.toThrow('boom');
    });
});
