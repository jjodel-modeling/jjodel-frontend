/**
 * simBoardIcons — an icon, a role and a shortcut key from an event's name (R-SIM-127;
 * P-2026-10-04-1130, docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md).
 *
 * A Button or a Clock of the I/O board shows a Bootstrap icon matched first from
 * the name of the event it presses, and overridable by its style (R-SIM-126). The
 * suggestion is computed when the face is drawn, from the event's label as the
 * board context holds it (simBoard.ts `BoardContext.events`), never stored: a
 * renamed event suggests again. Only an explicit `icon`, or `none`, is stored.
 *
 * - `eventWords` splits a name at camelCase, snake_case, kebab, spaces and
 *   letter-digit boundaries, strips accents and lowercases.
 * - `suggestIcon` tries the pairs of adjacent words first (`door open`,
 *   `apri porta`, …), then the single words in the name's order against a curated
 *   English and Italian dictionary; the first hit wins, and no hit gives no icon,
 *   never a random one. Start-like words suggest the role `go`, stop-like and
 *   cancel-like words `stop`; the others no role.
 * - `suggestKeys` gives a shortcut to each device its caller passes, in the order
 *   passed (the board's, row then column): an explicit key wins and is reserved
 *   first; a single-digit name keeps its digit; otherwise the first letter of the
 *   name no earlier device holds. The keyed devices are Button, Switch and Clock
 *   (the chat's answer to the report's question 2): a Slider has no press and a
 *   Keypad has its own keys, so the caller leaves them out.
 *
 * Every icon of the dictionary is an icon of the installed `bootstrap-icons`
 * (sim/__tests__/simBoardIcons.test.ts reads its JSON). Pure: no import but types.
 */

import type { ButtonRole } from '../../../model/simulation/boardCodec';

/** One icon of the dictionary, the role it suggests, and the words that call it. */
export interface IconEntry {
    readonly icon: string;
    readonly role: ButtonRole | null;
    readonly words: readonly string[];
}

/** A pair of adjacent words that names an icon before any single word does. */
export interface IconPair {
    readonly pair: string;
    readonly icon: string;
}

export interface IconSuggestion {
    /** A Bootstrap icon name without `bi-`; `null` when nothing matched. */
    readonly icon: string | null;
    readonly role: ButtonRole | null;
    /** Why: `pair «door open»`, `word «start»`, or `no match`, for the editor's picker. */
    readonly rule: string;
}

/** The dictionary, English and Italian, words in lower case without accents. */
export const ICON_TABLE: readonly IconEntry[] = [
    { icon: 'play-fill', role: 'go', words: ['start', 'go', 'run', 'play', 'begin', 'avvia', 'inizia', 'parti', 'cook', 'cuoci'] },
    { icon: 'stop-fill', role: 'stop', words: ['stop', 'halt', 'ferma', 'arresta', 'abort'] },
    { icon: 'x-lg', role: 'stop', words: ['cancel', 'annulla', 'reject', 'esc', 'no'] },
    { icon: 'check-lg', role: 'go', words: ['ok', 'confirm', 'enter', 'conferma', 'invio', 'accept', 'yes'] },
    { icon: 'pause-fill', role: null, words: ['pause', 'pausa'] },
    { icon: 'plus-lg', role: null, words: ['plus', 'add', 'inc', 'increment', 'piu', 'aggiungi', 'incrementa'] },
    { icon: 'dash-lg', role: null, words: ['minus', 'sub', 'dec', 'decrement', 'meno', 'togli', 'decrementa'] },
    { icon: 'arrow-counterclockwise', role: null, words: ['reset', 'clear', 'azzera', 'ripristina', 'reimposta'] },
    { icon: 'coin', role: null, words: ['coin', 'coins', 'moneta', 'monete', 'gettone'] },
    { icon: 'lock-fill', role: null, words: ['lock', 'blocca'] },
    { icon: 'unlock-fill', role: null, words: ['unlock', 'sblocca'] },
    { icon: 'door-open', role: null, words: ['door', 'porta', 'sportello'] },
    { icon: 'stopwatch', role: null, words: ['timer', 'tick', 'clock', 'tempo', 'cronometro'] },
    { icon: 'lightbulb', role: null, words: ['light', 'lamp', 'luce', 'lampada'] },
    { icon: 'power', role: null, words: ['power', 'accendi', 'spegni', 'alimentazione'] },
    { icon: 'fire', role: null, words: ['heat', 'riscalda', 'scalda', 'caldo'] },
    { icon: 'snow', role: null, words: ['cool', 'cold', 'raffredda', 'freddo'] },
    { icon: 'thermometer-half', role: null, words: ['temp', 'temperature', 'temperatura'] },
    { icon: 'bell', role: null, words: ['bell', 'ring', 'ding', 'campanello', 'suona', 'squilla'] },
    { icon: 'skip-forward-fill', role: null, words: ['next', 'skip', 'avanti', 'prossimo', 'successivo'] },
    { icon: 'arrow-up', role: null, words: ['up', 'su', 'sopra'] },
    { icon: 'arrow-down', role: null, words: ['down', 'giu', 'sotto'] },
    { icon: 'arrow-left', role: null, words: ['left', 'sinistra'] },
    { icon: 'arrow-right', role: null, words: ['right', 'destra'] },
    { icon: 'key', role: null, words: ['key', 'chiave', 'pin', 'password'] },
    { icon: 'cup-hot', role: null, words: ['coffee', 'caffe', 'espresso', 'tea'] },
    { icon: 'droplet', role: null, words: ['water', 'acqua'] },
    { icon: 'fan', role: null, words: ['fan', 'ventola', 'ventilatore'] },
    { icon: 'hourglass-split', role: null, words: ['wait', 'attendi', 'aspetta', 'attesa'] },
    { icon: 'cart', role: null, words: ['buy', 'purchase', 'compra', 'acquista'] },
    { icon: 'toggle-on', role: null, words: ['toggle', 'switch', 'commuta', 'alterna'] },
];

/** The pairs, tried before any single word: a door that opens or closes. */
export const ICON_PAIRS: readonly IconPair[] = [
    { pair: 'door open', icon: 'door-open' },
    { pair: 'open door', icon: 'door-open' },
    { pair: 'apri porta', icon: 'door-open' },
    { pair: 'apri sportello', icon: 'door-open' },
    { pair: 'door close', icon: 'door-closed' },
    { pair: 'close door', icon: 'door-closed' },
    { pair: 'chiudi porta', icon: 'door-closed' },
    { pair: 'chiudi sportello', icon: 'door-closed' },
];

const BY_WORD: ReadonlyMap<string, IconEntry> = new Map(ICON_TABLE.flatMap(e => e.words.map(w => [w, e] as [string, IconEntry])));
const BY_PAIR: ReadonlyMap<string, IconPair> = new Map(ICON_PAIRS.map(p => [p.pair, p]));

/** A name without accents: the combining marks of its canonical decomposition dropped. */
function plain(name: string): string {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** The words of a name: camelCase, snake_case, kebab, spaces and letter-digit boundaries; no accents; lower case. */
export function eventWords(name: string): string[] {
    return plain(name)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([A-Za-z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([A-Za-z])/g, '$1 $2')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(w => w !== '');
}

const NO_MATCH: IconSuggestion = { icon: null, role: null, rule: 'no match' };

/** The icon a name suggests: a pair of adjacent words first, then the single words in order; the first hit wins. */
export function suggestIcon(name: string): IconSuggestion {
    const words = eventWords(name);
    for (let i = 0; i + 1 < words.length; i++) {
        const pair = `${words[i]} ${words[i + 1]}`;
        const hit = BY_PAIR.get(pair);
        if (hit) return { icon: hit.icon, role: null, rule: `pair «${pair}»` };
    }
    for (const word of words) {
        const hit = BY_WORD.get(word);
        if (hit) return { icon: hit.icon, role: hit.role, rule: `word «${word}»` };
    }
    return NO_MATCH;
}

/** One device for `suggestKeys`: the name it is known by and its explicit key, a character `[a-z0-9]` or `none`. */
export interface KeyEntry {
    readonly name: string;
    readonly key?: string;
}

export interface KeySuggestion {
    /** The shortcut, one character `[a-z0-9]`; `null` for none. */
    readonly key: string | null;
    readonly rule: 'explicit' | 'none' | 'digit' | 'letter' | 'unassigned';
    /** An explicit key an earlier device already holds: a board defect; the device gets a suggestion instead. */
    readonly duplicate?: string;
}

const SHORTCUT = /^[a-z0-9]$/;

/**
 * A shortcut for each entry, in the order given (R-SIM-127). Explicit keys are reserved first, in order; a second
 * equal one is a defect and its entry is suggested like the others. `none` gives no key and reserves nothing. A
 * single-digit name keeps its digit; any other name its first letter no earlier entry holds; nothing left, no key.
 * An explicit key that is not a character `[a-z0-9]` is ignored.
 */
export function suggestKeys(entries: readonly KeyEntry[]): KeySuggestion[] {
    const taken = new Set<string>();
    const out: Array<KeySuggestion | null> = entries.map(e => {
        if (e.key === 'none') return { key: null, rule: 'none' };
        if (e.key !== undefined && SHORTCUT.test(e.key) && !taken.has(e.key)) {
            taken.add(e.key);
            return { key: e.key, rule: 'explicit' };
        }
        return null;
    });
    return entries.map((e, i) => {
        const done = out[i];
        if (done) return done;
        const duplicate = e.key !== undefined && SHORTCUT.test(e.key) ? { duplicate: e.key } : {};
        const name = plain(e.name).trim().toLowerCase();
        let key: string | null = null;
        let rule: KeySuggestion['rule'] = 'unassigned';
        if (/^[0-9]$/.test(name)) {
            if (!taken.has(name)) [key, rule] = [name, 'digit'];
        } else {
            const letter = [...name].find(c => c >= 'a' && c <= 'z' && !taken.has(c));
            if (letter) [key, rule] = [letter, 'letter'];
        }
        if (key !== null) taken.add(key);
        return { key, rule, ...duplicate };
    });
}
