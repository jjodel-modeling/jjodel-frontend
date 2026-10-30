/**
 * Script files of a project, the pure list operations (S6a, R-JJD-5). Each test names the mutation
 * that kills it.
 */
import { describe, it, expect } from 'vitest';
import {
    addScript, findScript, readScripts, removeScript, renameScript, scriptFileName, uniqueScriptName, updateScript,
} from '../projectScripts';
import type { DProjectScript } from '../../../joiner/classes';

const entry = (id: string, name: string, extra: Partial<DProjectScript> = {}): DProjectScript =>
    ({ id, name, text: 'create x', updatedAt: 1, ...extra });

describe('readScripts', () => {
    it('answers [] for a project without the field (kills: the || [] dropped)', () => {
        expect(readScripts({})).toEqual([]);
        expect(readScripts(undefined)).toEqual([]);
    });
    it('answers the stored list as it is (kills: a copy or a filter on read)', () => {
        const list = [entry('a', 'a.jjs')];
        expect(readScripts({ scripts: list })).toBe(list);
    });
});

describe('scriptFileName', () => {
    it('appends .jjs, keeps an existing one, trims, defaults to script.jjs (kills: the extension test inverted)', () => {
        expect(scriptFileName('demo')).toBe('demo.jjs');
        expect(scriptFileName('  demo.jjs ')).toBe('demo.jjs');
        expect(scriptFileName('demo.JJS')).toBe('demo.jjs');
        expect(scriptFileName('')).toBe('script.jjs');
        expect(scriptFileName('.jjs')).toBe('script.jjs');
    });
});

describe('uniqueScriptName', () => {
    const list = [entry('a', 'demo.jjs'), entry('b', 'demo (1).jjs')];
    it('a free name is kept (kills: the suffix always added)', () => {
        expect(uniqueScriptName('other', list)).toBe('other.jjs');
    });
    it('a taken name gets the first free (n) before the extension (kills: the counter starting at 2, the suffix after .jjs)', () => {
        expect(uniqueScriptName('demo', list)).toBe('demo (2).jjs');
        expect(uniqueScriptName('x', [entry('c', 'x.jjs')])).toBe('x (1).jjs');
    });
    it('the excepted entry does not take its own name (kills: exceptId ignored)', () => {
        expect(uniqueScriptName('demo', list, 'a')).toBe('demo.jjs');
    });
});

describe('addScript', () => {
    it('appends an entry with a unique name, the time and the id, without mutating the input (kills: push in place)', () => {
        const list = [entry('a', 'demo.jjs')];
        const { scripts, entry: e } = addScript(list, { name: 'demo', text: 'create P p', modelId: 'M1' }, 42, 'new');
        expect(list).toHaveLength(1);
        expect(scripts).toHaveLength(2);
        expect(e).toEqual({ id: 'new', name: 'demo (1).jjs', text: 'create P p', modelId: 'M1', updatedAt: 42 });
        expect(scripts[1]).toBe(e);
    });
    it('keeps generatedText when given and leaves modelId out when absent (kills: modelId written as undefined)', () => {
        const { entry: e } = addScript([], { text: 't', generatedText: 'g' }, 1, 'id');
        expect(e).toEqual({ id: 'id', name: 'script.jjs', text: 't', generatedText: 'g', updatedAt: 1 });
        expect('modelId' in e).toBe(false);
    });
});

describe('renameScript', () => {
    const list = [entry('a', 'a.jjs'), entry('b', 'b.jjs')];
    it('renames with the suffix rule against the others and stamps the time (kills: the rename not deduplicated)', () => {
        const out = renameScript(list, 'b', 'a', 9);
        expect(out[1]).toEqual({ ...list[1], name: 'a (1).jjs', updatedAt: 9 });
        expect(out[0]).toBe(list[0]);
        expect(list[1].name).toBe('b.jjs');
    });
    it('an unknown id returns the same array (kills: a rename of every entry)', () => {
        expect(renameScript(list, 'zz', 'c')).toBe(list);
    });
});

describe('updateScript', () => {
    const list = [entry('a', 'a.jjs'), entry('b', 'b.jjs')];
    it('patches the text and the model of one entry only, id and name kept (kills: the patch overriding id or name)', () => {
        const out = updateScript(list, 'a', { text: 'delete x', modelId: 'M2', id: 'evil', name: 'evil' } as any, 5);
        expect(out[0]).toEqual({ id: 'a', name: 'a.jjs', text: 'delete x', modelId: 'M2', updatedAt: 5 });
        expect(out[1]).toBe(list[1]);
        expect(list[0].text).toBe('create x');
    });
    it('an unknown id returns the same array (kills: the guard dropped)', () => {
        expect(updateScript(list, 'zz', { text: 'y' })).toBe(list);
    });
});

describe('removeScript and findScript', () => {
    const list = [entry('a', 'a.jjs'), entry('b', 'b.jjs')];
    it('removes one entry, leaves the input untouched (kills: splice in place)', () => {
        const out = removeScript(list, 'a');
        expect(out.map(s => s.id)).toEqual(['b']);
        expect(list).toHaveLength(2);
        expect(removeScript(list, 'zz')).toBe(list);
    });
    it('finds by id (kills: find by name)', () => {
        expect(findScript(list, 'b')?.name).toBe('b.jjs');
        expect(findScript(list, 'b.jjs')).toBeUndefined();
    });
});
