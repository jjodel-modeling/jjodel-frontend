/**
 * watchCodec — the invariants and breakpoints of a model, as its bag stores them
 * (R-SIM-137; P-2026-10-05-1735, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §2, W1).
 *
 * One key of the M1 bag, `runWatches`, a JSON string `{"v":1,"watches":[{name,kind,text}]}`: the fields in that
 * order, so the same watches give the same string; decoding tolerant entry by entry; no key until a list is
 * written, `[]` once one was. Each test name says which break of the rule kills it; the mutation bench is in the
 * commit message.
 */

import { describe, it, expect } from 'vitest';
import { decodeWatches, encodeWatches, RUN_WATCHES_KEY, WATCH_KINDS, watchesPatch } from '../watchCodec';
import type { WatchRecord } from '../watchCodec';

const COINS: WatchRecord = { name: 'coinsAtMost2', kind: 'invariant', text: 'model.[coins] <= 2' };
const PAID: WatchRecord = { name: 'paid', kind: 'breakpoint', text: 'model.[paid]' };

describe('the key (W1)', () => {
    it('is runWatches, not a sim* key: the run signature folds every sim* key of the model bag (mutant: simWatches)', () => {
        expect(RUN_WATCHES_KEY).toBe('runWatches');
        expect(RUN_WATCHES_KEY.startsWith('sim')).toBe(false);
        expect(WATCH_KINDS).toEqual(['invariant', 'breakpoint']);
    });
});

describe('encodeWatches: one string per list', () => {
    it('v first, then the list, each watch name, kind, text in that order whatever the record\'s key order (mutant: the record spread as given)', () => {
        const shuffled = { text: 'p3.[marked]', kind: 'breakpoint', name: 'p3Reached' } as WatchRecord;
        expect(encodeWatches([shuffled])).toBe('{"v":1,"watches":[{"name":"p3Reached","kind":"breakpoint","text":"p3.[marked]"}]}');
    });

    it('extra fields of a record are not written (mutant: the record spread as given)', () => {
        const extra = { ...COINS, note: 'x' } as WatchRecord;
        expect(encodeWatches([extra])).toBe(encodeWatches([COINS]));
    });

    it('the empty list is [] (W1: written as [], never a removed key)', () => {
        expect(encodeWatches([])).toBe('{"v":1,"watches":[]}');
    });
});

describe('decodeWatches: tolerant, entry by entry', () => {
    it('absent means no watches and no defect: a model without the key reads as before (mutants: absent read as unreadable; as a defect)', () => {
        for (const raw of [undefined, null]) expect(decodeWatches(raw)).toEqual({ watches: [], defects: [], readable: true });
    });

    it('byte-identical round trip: the string decoded and encoded again is the same string, quotes and non-ASCII included (mutant: a field dropped on decode)', () => {
        const raw = encodeWatches([COINS, PAID, { name: 'québec', kind: 'invariant', text: 'not (off.[marked] and model.[coins] == 3) -- "fin"' }]);
        const decoded = decodeWatches(raw);
        expect(decoded.defects).toEqual([]);
        expect(encodeWatches(decoded.watches)).toBe(raw);
        expect(decodeWatches('{"v":1,"watches":[]}')).toEqual({ watches: [], defects: [], readable: true });
    });

    it('a string that is not JSON, or has no v 1 and watches list, is one defect on the key and not readable, never an empty list (mutants: not JSON read as []; v not checked)', () => {
        const notJson = decodeWatches('{"v":1,');
        expect([notJson.watches, notJson.readable, notJson.defects.length, notJson.defects[0].index]).toEqual([[], false, 1, null]);
        for (const raw of ['{"watches":[]}', '{"v":1}', '{"v":1,"watches":{}}', '[]', '"x"', '{"v":2,"watches":[]}']) {
            const d = decodeWatches(raw);
            expect([raw, d.readable, d.defects.length, d.defects[0]?.index]).toEqual([raw, false, 1, null]);
        }
    });

    it('a bad entry drops with a defect naming its index, and its name when readable; the others decode in order (mutants: the whole list dropped; the defect without the index)', () => {
        const raw = JSON.stringify({
            v: 1,
            watches: [
                COINS,
                'not a record',
                { kind: 'invariant', text: 'true' },
                { name: '', kind: 'invariant', text: 'true' },
                { name: 'odd', kind: 'assertion', text: 'true' },
                { name: 'notText', kind: 'breakpoint', text: 3 },
                PAID,
            ],
        });
        const d = decodeWatches(raw);
        expect(d.readable).toBe(true);
        expect(d.watches).toEqual([COINS, PAID]);
        expect(d.defects.map(x => [x.index, x.name])).toEqual([[1, null], [2, null], [3, null], [4, 'odd'], [5, 'notText']]);
        for (const x of d.defects) expect(x.message.length).toBeGreaterThan(0);
    });

    it('a name used twice: the later one drops with a defect, the first one stays (mutants: the duplicate kept; the first dropped)', () => {
        const d = decodeWatches(encodeWatches([COINS, { ...PAID, name: 'coinsAtMost2' }, PAID]));
        expect(d.watches).toEqual([COINS, PAID]);
        expect(d.defects).toHaveLength(1);
        expect([d.defects[0].index, d.defects[0].name]).toEqual([1, 'coinsAtMost2']);
    });

    it('an empty text is a watch: it is a compile defect of the watch, not a record defect (mutant: a blank text dropped)', () => {
        const blank: WatchRecord = { name: 'blank', kind: 'invariant', text: '' };
        expect(decodeWatches(encodeWatches([blank]))).toEqual({ watches: [blank], defects: [], readable: true });
    });

    it('unknown fields of an entry and of the root are ignored (mutant: an unknown field read as a defect)', () => {
        const d = decodeWatches('{"v":1,"note":"x","watches":[{"name":"a","kind":"breakpoint","text":"true","color":"red"}]}');
        expect(d).toEqual({ watches: [{ name: 'a', kind: 'breakpoint', text: 'true' }], defects: [], readable: true });
    });
});

describe('watchesPatch: what Apply writes, one state assignment of the key alone (one undo step)', () => {
    it('no key and no watches: nothing to write, the bag keeps its bytes (mutant: [] written on an untouched model)', () => {
        expect(watchesPatch(undefined, [])).toBeNull();
        expect(watchesPatch(null, [])).toBeNull();
    });

    it('a first watch writes the key alone; the same list again writes nothing (mutant: a write on every Apply)', () => {
        const patch = watchesPatch(undefined, [COINS]);
        expect(patch).toEqual({ runWatches: encodeWatches([COINS]) });
        expect(watchesPatch(patch!.runWatches, [COINS])).toBeNull();
    });

    it('emptying a stored list writes [], never removes the key: the undo of a removed key does not restore it (R-SIM-99; mutant: the key removed)', () => {
        expect(watchesPatch(encodeWatches([COINS]), [])).toEqual({ runWatches: '{"v":1,"watches":[]}' });
        expect(watchesPatch('{"v":1,"watches":[]}', [])).toBeNull();
    });

    it('an unreadable key is replaced by the list as written (mutant: an unreadable key kept)', () => {
        expect(watchesPatch('{"v":1,', [PAID])).toEqual({ runWatches: encodeWatches([PAID]) });
    });
});
