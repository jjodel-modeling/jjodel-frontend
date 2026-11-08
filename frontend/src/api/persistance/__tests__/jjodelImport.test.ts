/**
 * The shared import of `.jjodel` files (P-2026-11-08-2015). `projects.ts` does not load in node (the joiner writes on
 * `window`), so the importer is a stub; the store check is exercised through the pure function `projects.ts` calls.
 * Each test name says which break kills it.
 */
import { describe, expect, it } from 'vitest';
import {
    importJjodelFile,
    importJjodelFiles,
    isJjodelFile,
    partitionJjodelFiles,
    requireStoredProject,
} from '../jjodelImport';

const file = (name: string, content: string = '{}') => new File([content], name);
const names = (files: File[]) => files.map(f => f.name);

describe('isJjodelFile: the extension filter', () => {
    it.each([
        ['a.jjodel', true],
        ['UP.JJODEL', true],
        ['Mixed.JjOdEl', true],
        ['two.dots.jjodel', true],
        ['a.jjodel.pdf', false],
        ['a.pdf', false],
        ['noextension', false],
        ['jjodel', false],
        ['ajjodel', false],
    ])('%s -> %s (dies if the anchor, the dot or the i flag goes)', (name, expected) => {
        expect(isJjodelFile(file(name))).toBe(expected);
    });
});

describe('partitionJjodelFiles', () => {
    it('keeps the input order on both sides (dies if a side is reversed or sorted)', () => {
        const { accepted, rejected } = partitionJjodelFiles([
            file('z.jjodel'), file('z.pdf'), file('a.jjodel'), file('a.pdf'),
        ]);
        expect(names(accepted)).toEqual(['z.jjodel', 'a.jjodel']);
        expect(names(rejected)).toEqual(['z.pdf', 'a.pdf']);
    });

    it('takes an array-like such as a FileList (dies if it needs a real array)', () => {
        const list = { 0: file('a.jjodel'), length: 1, item: () => null } as unknown as FileList;
        expect(names(partitionJjodelFiles(list).accepted)).toEqual(['a.jjodel']);
    });
});

describe('importJjodelFile', () => {
    it('hands the text of the file to the importer and returns its id (dies if the content or the id is lost)', async () => {
        const f = file('a.jjodel', 'the content');
        const seen: string[] = [];
        const result = await importJjodelFile(f, async content => { seen.push(content); return 'id-1'; });
        expect(seen).toEqual(['the content']);
        expect(result).toEqual({ file: f, ok: true, projectId: 'id-1' });
    });

    it('does not call the importer on a rejected extension (dies if the filter is skipped)', async () => {
        const f = file('a.pdf');
        let calls = 0;
        const result = await importJjodelFile(f, async () => { calls++; return 'id'; });
        expect(calls).toBe(0);
        expect(result).toEqual({ file: f, ok: false, reason: 'extension' });
    });

    it('maps an importer that rejects to a failure (dies if the catch goes)', async () => {
        const f = file('a.jjodel');
        const result = await importJjodelFile(f, async () => { throw new Error('boom'); });
        expect(result).toEqual({ file: f, ok: false, reason: 'failed' });
    });

    it('maps a file that cannot be read to a failure (dies if the read is outside the try)', async () => {
        const f = file('a.jjodel');
        f.text = () => Promise.reject(new Error('unreadable'));
        let calls = 0;
        const result = await importJjodelFile(f, async () => { calls++; return 'id'; });
        expect(calls).toBe(0);
        expect(result).toEqual({ file: f, ok: false, reason: 'failed' });
    });
});

describe('importJjodelFiles', () => {
    it('imports at most one file at a time (dies if the loop becomes Promise.all)', async () => {
        let inFlight = 0;
        let peak = 0;
        const results = await importJjodelFiles([file('a.jjodel'), file('b.jjodel'), file('c.jjodel')], async () => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await new Promise(resolve => setTimeout(resolve, 1));
            inFlight--;
            return 'id';
        });
        expect(peak).toBe(1);
        expect(results).toHaveLength(3);
    });

    it('imports in the order of the input (dies if the order is lost)', async () => {
        const seen: string[] = [];
        await importJjodelFiles([file('b.jjodel', 'b'), file('a.jjodel', 'a'), file('c.jjodel', 'c')], async content => {
            seen.push(content);
            return content;
        });
        expect(seen).toEqual(['b', 'a', 'c']);
    });

    it('goes on after a failing file (dies if a failure stops the loop)', async () => {
        const results = await importJjodelFiles([file('bad.jjodel', 'bad'), file('good.jjodel', 'good')], async content => {
            if (content === 'bad') throw new Error('boom');
            return 'id-good';
        });
        expect(results.map(r => r.ok)).toEqual([false, true]);
        expect(results[1]).toMatchObject({ ok: true, projectId: 'id-good' });
    });

    it('returns one result per file, in input order, rejected extensions included (dies if they are dropped or moved)', async () => {
        const results = await importJjodelFiles([file('a.pdf'), file('b.jjodel'), file('c.txt')], async () => 'id');
        expect(results.map(r => r.file.name)).toEqual(['a.pdf', 'b.jjodel', 'c.txt']);
        expect(results[0]).toMatchObject({ ok: false, reason: 'extension' });
        expect(results[1]).toMatchObject({ ok: true });
        expect(results[2]).toMatchObject({ ok: false, reason: 'extension' });
    });

    it('takes the list before its first await (dies if a live FileList is read later, as a drop empties it)', async () => {
        const live: File[] = [file('a.jjodel'), file('b.jjodel')];
        const pending = importJjodelFiles(live, async () => 'id');
        live.length = 0;
        expect(await pending).toHaveLength(2);
    });
});

describe('requireStoredProject: an importer resolves only with an id the store holds', () => {
    it('returns the id the store holds (dies if the id is not returned)', () => {
        expect(requireStoredProject('p2', ['p1', 'p2'])).toBe('p2');
    });

    it('throws on an id absent from the store (dies if the membership check goes)', () => {
        expect(() => requireStoredProject('p3', ['p1', 'p2'])).toThrow();
    });

    it('throws when the transaction never reached the store (dies if undefined is let through)', () => {
        expect(() => requireStoredProject(undefined, ['p1'])).toThrow();
    });
});
