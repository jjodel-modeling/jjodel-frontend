/**
 * The recent imports the cards read (P-2026-11-08-2215). Each test name says which break kills it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createRecentImports, RECENT_IMPORT_MS, recordingImports } from '../recentImports';
import type { RecentImportsClock } from '../recentImports';

function fakeClock() {
    let time = 0;
    let nextHandle = 1;
    const timers = new Map<unknown, { at: number; callback: () => void }>();
    const clock: RecentImportsClock = {
        now: () => time,
        setTimeout: (callback, ms) => {
            const handle = nextHandle++;
            timers.set(handle, { at: time + ms, callback });
            return handle;
        },
        clearTimeout: handle => { timers.delete(handle); },
    };
    const advance = (ms: number) => {
        const target = time + ms;
        for (;;) {
            const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
            if (!due) break;
            timers.delete(due[0]);
            time = due[1].at;
            due[1].callback();
        }
        time = target;
    };
    // Moves the time without running any timer, as a throttled background tab does.
    const skip = (ms: number) => { time += ms; };
    return { clock, advance, skip, pending: () => timers.size };
}

describe('createRecentImports', () => {
    it('holds an added id and no other', () => {
        const { clock } = fakeClock();
        const recent = createRecentImports(clock);
        recent.add('a');
        expect(recent.has('a')).toBe(true);
        expect(recent.has('b')).toBe(false);
    });

    it('drops an id exactly when its lifetime ends, by default 6 s', () => {
        const { clock, advance } = fakeClock();
        const recent = createRecentImports(clock);
        expect(RECENT_IMPORT_MS).toBe(6000);
        recent.add('a');
        advance(5999);
        expect(recent.has('a')).toBe(true);
        advance(1);
        expect(recent.has('a')).toBe(false);
    });

    it('takes the lifetime it is given, in the timer too', () => {
        const { clock, advance, pending } = fakeClock();
        const recent = createRecentImports(clock, 100);
        recent.add('a');
        advance(99);
        expect(recent.has('a')).toBe(true);
        advance(1);
        expect(recent.has('a')).toBe(false);
        expect(pending()).toBe(0);
    });

    it('reports an expired id as gone even when its timer has not run', () => {
        const { clock, skip, pending } = fakeClock();
        const recent = createRecentImports(clock, 100);
        recent.add('a');
        skip(99);
        expect(recent.has('a')).toBe(true);
        skip(1);
        expect(pending()).toBe(1);
        expect(recent.has('a')).toBe(false);
    });

    it('forgets an expired id: importing it again finds no timer to clear', () => {
        const { clock, advance } = fakeClock();
        const clearTimeout = vi.spyOn(clock, 'clearTimeout');
        const recent = createRecentImports(clock);
        recent.add('a');
        advance(RECENT_IMPORT_MS);
        recent.add('a');
        expect(clearTimeout).not.toHaveBeenCalled();
    });

    it('expires several ids each on its own time', () => {
        const { clock, advance } = fakeClock();
        const recent = createRecentImports(clock);
        recent.add('a');
        advance(1000);
        recent.add('b');
        advance(5000);
        expect(recent.has('a')).toBe(false);
        expect(recent.has('b')).toBe(true);
        advance(1000);
        expect(recent.has('b')).toBe(false);
    });

    it('refreshes an id imported again: the first timer no longer drops it', () => {
        const { clock, advance, pending } = fakeClock();
        const recent = createRecentImports(clock);
        recent.add('a');
        advance(4000);
        recent.add('a');
        expect(pending()).toBe(1);
        advance(5999);
        expect(recent.has('a')).toBe(true);
        advance(1);
        expect(recent.has('a')).toBe(false);
    });

    it('tells a subscriber of every add and every expiry, and stops when it unsubscribes', () => {
        const { clock, advance } = fakeClock();
        const recent = createRecentImports(clock);
        const listener = vi.fn();
        const unsubscribe = recent.subscribe(listener);
        recent.add('a');
        expect(listener).toHaveBeenCalledTimes(1);
        advance(RECENT_IMPORT_MS);
        expect(listener).toHaveBeenCalledTimes(2);
        unsubscribe();
        recent.add('b');
        advance(RECENT_IMPORT_MS);
        expect(listener).toHaveBeenCalledTimes(2);
    });

});

describe('recordingImports', () => {
    it('records the id the importer resolves with and passes it on, with the content untouched', async () => {
        const { clock } = fakeClock();
        const recent = createRecentImports(clock);
        const importer = vi.fn(async (_content: string) => 'stored');
        await expect(recordingImports(importer, recent)('text')).resolves.toBe('stored');
        expect(importer).toHaveBeenCalledWith('text');
        expect(recent.has('stored')).toBe(true);
    });

    it('records nothing when the importer rejects, and rejects too', async () => {
        const { clock } = fakeClock();
        const recent = createRecentImports(clock);
        const add = vi.spyOn(recent, 'add');
        await expect(recordingImports(async () => { throw new Error('not stored'); }, recent)('text')).rejects.toThrow('not stored');
        expect(add).not.toHaveBeenCalled();
    });
});
