/**
 * simBoardIcons — an icon, a role and a shortcut key from an event's name (R-SIM-127;
 * P-2026-10-04-1130, docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md).
 *
 * The table of the mock-up «Front panel styles» validated by Alfonso, the keys with
 * their collisions and reservations, and every icon of the dictionary against the
 * installed `bootstrap-icons.json`, the set the editor's picker will list. Each test
 * name says which break of the rule kills it; the mutation bench is in the commit
 * message.
 */

import { describe, it, expect } from 'vitest';
import icons from 'bootstrap-icons/font/bootstrap-icons.json';
import { ICON_PAIRS, ICON_TABLE, eventWords, suggestIcon, suggestKeys } from '../simBoardIcons';

describe('eventWords: the words of a name', () => {
    it('camelCase, snake_case, kebab, spaces and letter-digit boundaries split; accents stripped; lower case (mutants: no camel split; no digit split)', () => {
        expect(eventWords('startCooking')).toEqual(['start', 'cooking']);
        expect(eventWords('apri_porta')).toEqual(['apri', 'porta']);
        expect(eventWords('door-open')).toEqual(['door', 'open']);
        expect(eventWords('Avvia  Lavaggio')).toEqual(['avvia', 'lavaggio']);
        expect(eventWords('plus30')).toEqual(['plus', '30']);
        expect(eventWords('30plus')).toEqual(['30', 'plus']);
        expect(eventWords('e1')).toEqual(['e', '1']);
        expect(eventWords('HTTPServer')).toEqual(['http', 'server']);
        expect(eventWords('Più')).toEqual(['piu']);
        expect(eventWords('caffè.giù')).toEqual(['caffe', 'giu']);
        expect(eventWords('')).toEqual([]);
        expect(eventWords('__--  ')).toEqual([]);
    });
});

describe('suggestIcon: pairs first, then single words in the name\'s order, the first hit wins, no hit no icon', () => {
    it('the table of the mock-up (R-SIM-127)', () => {
        const table: Array<[string, string | null, string | null, string]> = [
            ['plus30', 'plus-lg', null, 'word «plus»'],
            ['startCooking', 'play-fill', 'go', 'word «start»'],
            ['stop', 'stop-fill', 'stop', 'word «stop»'],
            ['doorOpen', 'door-open', null, 'pair «door open»'],
            ['insertCoin', 'coin', null, 'word «coin»'],
            ['reset', 'arrow-counterclockwise', null, 'word «reset»'],
            ['avviaLavaggio', 'play-fill', 'go', 'word «avvia»'],
            ['apri_porta', 'door-open', null, 'pair «apri porta»'],
            ['tick', 'stopwatch', null, 'word «tick»'],
            ['e1', null, null, 'no match'],
            ['5', null, null, 'no match'],
        ];
        for (const [name, icon, role, rule] of table) expect([name, suggestIcon(name)]).toEqual([name, { icon, role, rule }]);
    });

    it('a pair wins over a single word that comes before it (mutant: words before pairs)', () => {
        expect(suggestIcon('closeDoor').icon).toBe('door-closed');
        expect(suggestIcon('door_close').icon).toBe('door-closed');
        expect(suggestIcon('chiudiPorta').icon).toBe('door-closed');
        expect(suggestIcon('openDoor').icon).toBe('door-open');
        expect(suggestIcon('door').icon).toBe('door-open');
    });

    it('the first word that hits wins, in the name\'s order (mutant: the last hit; mutant: dictionary order)', () => {
        expect(suggestIcon('startStop')).toMatchObject({ icon: 'play-fill', role: 'go' });
        expect(suggestIcon('stopStart')).toMatchObject({ icon: 'stop-fill', role: 'stop' });
        expect(suggestIcon('cookingStart')).toMatchObject({ icon: 'play-fill', rule: 'word «start»' });
    });

    it('Italian synonyms, and the four roles the names suggest: go, stop, none (mutant: a role on a neutral icon)', () => {
        expect(suggestIcon('ferma')).toEqual({ icon: 'stop-fill', role: 'stop', rule: 'word «ferma»' });
        expect(suggestIcon('annulla')).toEqual({ icon: 'x-lg', role: 'stop', rule: 'word «annulla»' });
        expect(suggestIcon('conferma')).toEqual({ icon: 'check-lg', role: 'go', rule: 'word «conferma»' });
        expect(suggestIcon('cuoci')).toMatchObject({ icon: 'play-fill', role: 'go' });
        expect(suggestIcon('Più')).toEqual({ icon: 'plus-lg', role: null, rule: 'word «piu»' });
        expect(suggestIcon('pausa')).toEqual({ icon: 'pause-fill', role: null, rule: 'word «pausa»' });
    });

    it('never a random icon: unknown words give none (mutant: a fallback icon)', () => {
        for (const name of ['', 'xyzzy', 'fooBar', 'insert', 'e', '42']) expect(suggestIcon(name)).toEqual({ icon: null, role: null, rule: 'no match' });
    });
});

describe('the dictionary against the installed Bootstrap Icons', () => {
    const installed = new Set(Object.keys(icons as Record<string, number>));

    it('the check discriminates: a known name is in the set, an invented one is not (positive control)', () => {
        expect(installed.size).toBeGreaterThan(1000);
        expect(installed.has('play-fill')).toBe(true);
        expect(installed.has('no-such-icon')).toBe(false);
    });

    it('every icon of the dictionary and of the pairs is installed (R-SIM-127; mutant: a misspelt icon)', () => {
        const used = [...ICON_TABLE.map(e => e.icon), ...ICON_PAIRS.map(p => p.icon)];
        expect(used.length).toBeGreaterThan(30);
        expect(used.filter(name => !installed.has(name))).toEqual([]);
    });

    it('no word and no pair is listed twice: the first hit would hide the second (mutant: a duplicated word)', () => {
        const words = ICON_TABLE.flatMap(e => e.words);
        expect(words.length).toBe(new Set(words).size);
        const pairs = ICON_PAIRS.map(p => p.pair);
        expect(pairs.length).toBe(new Set(pairs).size);
        expect(pairs).toEqual(expect.arrayContaining(['door open', 'open door', 'apri porta', 'door close', 'chiudi porta']));
    });
});

describe('suggestKeys: a shortcut per device, in the order the caller passes (R-SIM-127)', () => {
    it('a single-digit name keeps its digit; otherwise the first letter of the name not taken by an earlier device (mutants: always the first letter; digits ignored)', () => {
        const r = suggestKeys([{ name: 'startCooking' }, { name: 'stop' }, { name: 'plus30' }, { name: '5' }, { name: 'Door' }, { name: 'Ècco' }]);
        expect(r.map(x => [x.key, x.rule])).toEqual([['s', 'letter'], ['t', 'letter'], ['p', 'letter'], ['5', 'digit'], ['d', 'letter'], ['e', 'letter']]);
    });

    it('an explicit key wins and is reserved before any suggestion; none gives no key and reserves nothing (mutant: explicit keys reserved in order)', () => {
        const r = suggestKeys([{ name: 'start' }, { name: 'stop', key: 's' }, { name: 'apple', key: 'none' }, { name: 'about' }]);
        expect(r.map(x => [x.key, x.rule])).toEqual([['t', 'letter'], ['s', 'explicit'], [null, 'none'], ['a', 'letter']]);
    });

    it('two explicit equal keys: the second is a defect and gets a suggestion instead (mutant: both keep the key)', () => {
        const r = suggestKeys([{ name: 'x', key: 'q' }, { name: 'y', key: 'q' }]);
        expect(r).toEqual([{ key: 'q', rule: 'explicit' }, { key: 'y', rule: 'letter', duplicate: 'q' }]);
    });

    it('nothing left: a taken digit or letters all taken give no key; an invalid explicit key is ignored (mutant: a taken key given twice)', () => {
        expect(suggestKeys([{ name: 'a', key: '5' }, { name: '5' }]).map(x => [x.key, x.rule])).toEqual([['5', 'explicit'], [null, 'unassigned']]);
        expect(suggestKeys([{ name: 'aa' }, { name: 'a' }, { name: '' }]).map(x => [x.key, x.rule])).toEqual([['a', 'letter'], [null, 'unassigned'], [null, 'unassigned']]);
        expect(suggestKeys([{ name: 'Quit', key: 'Q' }]).map(x => [x.key, x.rule])).toEqual([['q', 'letter']]);
    });
});
