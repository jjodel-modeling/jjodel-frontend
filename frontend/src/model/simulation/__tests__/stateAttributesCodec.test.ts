/**
 * stateAttributesCodec — the declared state attributes in the M2 bag (lane C1,
 * P-2026-09-26-2340, R-SIM-67, R-SIM-68).
 *
 * Executes the encoder and the two readers (P11): the round trip with its fixed
 * field order, the per-record decoding with its defects, the key defects, the
 * fields a record may carry and the decoder ignores, the initial value as a
 * JjEL literal, and the tolerant rows the panel edits. Each test name says
 * which break kills it; the mutation bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import {
    decodeStateAttributes, encodeStateAttributes, parseInitialLiteral, stateAttributeRows, STATE_ATTRIBUTES_KEY,
} from '../stateAttributesCodec';
import type { StateAttributeRecord } from '../stateAttributesCodec';

const VISITS: StateAttributeRecord = { name: 'visits', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' };
const COLOR: StateAttributeRecord = { name: 'color', metaclass: 'C_PTr', space: 'presentation', domain: null, initial: "'grey'" };
const F: StateAttributeRecord = { name: 'f', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' };
const MODE: StateAttributeRecord = { name: 'mode', metaclass: null, space: 'semantic', domain: { kind: 'enum', literals: ['A', 'B'] }, initial: 'A' };

/** A stored string with the records given as they are, whatever their shape. */
const stored = (attrs: unknown[]) => JSON.stringify({ v: 1, attrs });

describe('encode: one string, fields in a fixed order (R-SIM-67)', () => {
    it('the key is simStateAttributes; the string is {"v":1,"attrs":[...]} with name, metaclass, space, domain, initial', () => {
        expect(STATE_ATTRIBUTES_KEY).toBe('simStateAttributes');
        expect(encodeStateAttributes([VISITS, COLOR])).toBe(
            '{"v":1,"attrs":['
            + '{"name":"visits","metaclass":"C_Place","space":"semantic","domain":{"kind":"range","min":0,"max":3},"initial":"0"},'
            + '{"name":"color","metaclass":"C_PTr","space":"presentation","domain":null,"initial":"\'grey\'"}]}');
        expect(encodeStateAttributes([])).toBe('{"v":1,"attrs":[]}');
    });

    it('the order does not depend on the input object: the same record with its keys shuffled gives the same string (mutant 3)', () => {
        const shuffled = { initial: '0', domain: { max: 3, kind: 'range', min: 0 }, space: 'semantic', metaclass: 'C_Place', name: 'visits' } as unknown as StateAttributeRecord;
        const enumShuffled = { initial: 'A', domain: { literals: ['A', 'B'], kind: 'enum' }, name: 'mode', space: 'semantic', metaclass: null } as unknown as StateAttributeRecord;
        expect(encodeStateAttributes([shuffled, enumShuffled])).toBe(encodeStateAttributes([VISITS, MODE]));
        // control: a different record gives a different string
        expect(encodeStateAttributes([{ ...VISITS, name: 'other' }])).not.toBe(encodeStateAttributes([VISITS]));
    });

    it('round trip: the decoded declarations carry the initial values typed by their literals', () => {
        const { decls, defects } = decodeStateAttributes(encodeStateAttributes([VISITS, COLOR, F, MODE]));
        expect(defects).toEqual([]);
        expect(decls).toEqual([
            { name: 'visits', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 0 },
            { name: 'color', metaclass: 'C_PTr', space: 'presentation', domain: null, initial: 'grey' },
            { name: 'f', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: false },
            { name: 'mode', metaclass: null, space: 'semantic', domain: { kind: 'enum', literals: ['A', 'B'] }, initial: 'A' },
        ]);
    });
});

describe('decode: tolerant, a defect per record (R-SIM-68)', () => {
    it('undefined is the empty set with no defect; the empty table is empty with no defect', () => {
        expect(decodeStateAttributes(undefined)).toEqual({ decls: [], defects: [] });
        expect(decodeStateAttributes('{"v":1,"attrs":[]}')).toEqual({ decls: [], defects: [] });
    });

    it('a string that is not JSON is one defect on the key, never a silent empty set (mutant 1)', () => {
        const out = decodeStateAttributes('{"v":1,"attrs":[');
        expect(out.decls).toEqual([]);
        expect(out.defects).toEqual([{ index: null, name: null, code: 'key', message: 'not JSON' }]);
    });

    it('JSON without v or attrs, a bare array, another version: one defect on the key each', () => {
        for (const raw of ['{"attrs":[]}', '{"v":1}', '[]', '{"v":1,"attrs":{}}', '{"v":2,"attrs":[]}', '""', '7']) {
            const out = decodeStateAttributes(raw);
            expect([raw, out.decls, out.defects.map(d => [d.index, d.code])]).toEqual([raw, [], [[null, 'key']]]);
        }
        // control: v and attrs present
        expect(decodeStateAttributes('{"v":1,"attrs":[]}').defects).toEqual([]);
    });

    it('a malformed record is a defect with its index and its name when readable; the others decode', () => {
        const out = decodeStateAttributes(stored([
            { ...VISITS },
            { ...COLOR, space: 'visual' },
            { name: 7, metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'true' },
            { ...F },
        ]));
        expect(out.decls.map(d => d.name)).toEqual(['visits', 'f']);
        expect(out.defects).toEqual([
            { index: 1, name: 'color', code: 'record', message: 'bad space' },
            { index: 2, name: null, code: 'record', message: 'no name' },
        ]);
    });

    it('each field is checked: name, metaclass, space, domain shape, initial', () => {
        const bad: Array<[string, Record<string, unknown>]> = [
            ['empty name', { ...VISITS, name: '' }],
            ['metaclass not a string', { ...VISITS, metaclass: 3 }],
            ['no space', { ...VISITS, space: undefined }],
            ['a domain of no kind', { ...VISITS, domain: { kind: 'set' } }],
            ['range bounds that are not numbers', { ...VISITS, domain: { kind: 'range', min: '0', max: 3 } }],
            ['enum literals that are not strings', { ...VISITS, domain: { kind: 'enum', literals: [1] } }],
            ['initial not a string', { ...VISITS, initial: 0 }],
            ['no initial', { ...VISITS, initial: undefined }],
            ['a record that is not an object', 'visits' as unknown as Record<string, unknown>],
        ];
        for (const [what, record] of bad) {
            const out = decodeStateAttributes(stored([record]));
            expect([what, out.decls.length, out.defects.map(d => [d.index, d.code])]).toEqual([what, 0, [[0, 'record']]]);
        }
    });

    it('unknown fields are ignored; the record decodes (mutant 2)', () => {
        const out = decodeStateAttributes(stored([
            { ...VISITS, formula: 'self.[a] + 1' },
            { ...COLOR, note: 'x', domain: null },
            { ...VISITS, name: 'v2', domain: { kind: 'range', min: 0, max: 3, step: 1 } },
        ]));
        expect(out.defects).toEqual([]);
        expect(out.decls.map(d => d.name)).toEqual(['visits', 'color', 'v2']);
        expect(out.decls[0]).not.toHaveProperty('formula');
        expect(out.decls[2].domain).toEqual({ kind: 'range', min: 0, max: 3 });
    });

    it('an initial that is not a JjEL literal is a defect of the record', () => {
        for (const initial of ['a b', 'null', '[1]', '1 + 1', '', 'self.x']) {
            const out = decodeStateAttributes(stored([{ ...VISITS, initial }]));
            expect([initial, out.defects.map(d => d.code)]).toEqual([initial, ['record']]);
        }
    });
});

describe('the initial value, a JjEL literal typed by its form (question 14, question 15)', () => {
    it('true, a natural, a negative number, a quoted string, a free identifier as an enumeration literal', () => {
        expect(parseInitialLiteral('true')).toBe(true);
        expect(parseInitialLiteral('false')).toBe(false);
        expect(parseInitialLiteral('3')).toBe(3);
        expect(parseInitialLiteral('-1')).toBe(-1);
        expect(parseInitialLiteral("'red'")).toBe('red');
        expect(parseInitialLiteral('"red"')).toBe('red');
        expect(parseInitialLiteral('A')).toBe('A');
        expect(parseInitialLiteral(' 2 ')).toBe(2);
    });

    it('anything else is not a literal: null, a collection, an expression, two tokens, the empty text', () => {
        for (const text of ['null', '[1]', '1 + 1', 'a b', '', '-x', 'self.name']) expect([text, parseInitialLiteral(text)]).toEqual([text, null]);
    });
});

describe('stateAttributeRows: what the panel edits, malformed fields as defaults', () => {
    it('the records as rows, in order; a malformed field falls back so the row can be fixed; unknown fields dropped', () => {
        const raw = stored([VISITS, { name: 7, space: 'visual', domain: { kind: 'set' }, initial: 0 }, { ...COLOR, note: 'x' }]);
        const { rows, readable } = stateAttributeRows(raw);
        expect(readable).toBe(true);
        expect(rows).toEqual([
            VISITS,
            { name: '', metaclass: null, space: 'semantic', domain: null, initial: '0' },
            COLOR,
        ]);
    });

    it('undefined is readable and empty; a key that is not readable gives no rows', () => {
        expect(stateAttributeRows(undefined)).toEqual({ rows: [], readable: true });
        expect(stateAttributeRows('nope')).toEqual({ rows: [], readable: false });
        expect(stateAttributeRows('{"v":1}')).toEqual({ rows: [], readable: false });
    });

    it('rows encode back to the same string when nothing was malformed', () => {
        const raw = encodeStateAttributes([VISITS, COLOR, F, MODE]);
        expect(encodeStateAttributes(stateAttributeRows(raw).rows)).toBe(raw);
    });
});

describe('lane C2: a record carries initial or equation, never both (P-2026-09-27-0200, R-SIM-72, R-SIM-75)', () => {
    const TOTAL: StateAttributeRecord = {
        name: 'total', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 6 }, initial: '', equation: 'p1.[visits] + p2.[visits]',
    };
    const BUSY: StateAttributeRecord = { name: 'busy', metaclass: 'C_Place', space: 'presentation', domain: null, initial: '', equation: 'self.[visits] > 0' };

    it('encode: a derived record writes equation where a stored one writes initial, in the fixed order, never both', () => {
        expect(encodeStateAttributes([VISITS, TOTAL])).toBe(
            '{"v":1,"attrs":['
            + '{"name":"visits","metaclass":"C_Place","space":"semantic","domain":{"kind":"range","min":0,"max":3},"initial":"0"},'
            + '{"name":"total","metaclass":null,"space":"semantic","domain":{"kind":"range","min":0,"max":6},"equation":"p1.[visits] + p2.[visits]"}]}');
    });

    it('decode: a derived record is a declaration with its equation and no initial', () => {
        const { decls, defects } = decodeStateAttributes(encodeStateAttributes([VISITS, TOTAL, BUSY]));
        expect(defects).toEqual([]);
        expect(decls[1]).toEqual({ name: 'total', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 6 }, equation: 'p1.[visits] + p2.[visits]' });
        expect(decls[1]).not.toHaveProperty('initial');
        expect(decls[2]).toEqual({ name: 'busy', metaclass: 'C_Place', space: 'presentation', domain: null, equation: 'self.[visits] > 0' });
        // control: a stored record has no equation
        expect(decls[0]).not.toHaveProperty('equation');
    });

    it('exclusivity: initial and equation together is a defect of its own; neither is a record defect; a blank equation too', () => {
        const out = decodeStateAttributes(stored([
            { ...VISITS, equation: 'self.[a] + 1' },
            { name: 'n', metaclass: null, space: 'semantic', domain: { kind: 'boolean' } },
            { ...TOTAL, initial: undefined, equation: '  ' },
            { ...TOTAL, initial: undefined, equation: 3 },
            { ...TOTAL, initial: undefined },
        ]));
        expect(out.decls.map(d => d.name)).toEqual(['total']);
        expect(out.defects).toEqual([
            { index: 0, name: 'visits', code: 'exclusive', message: 'initial and equation' },
            { index: 1, name: 'n', code: 'record', message: 'no initial or equation' },
            { index: 2, name: 'total', code: 'record', message: 'no equation text' },
            { index: 3, name: 'total', code: 'record', message: 'no equation text' },
        ]);
    });

    it('round trip through the rows keeps equation: a derived row is carried whole (report §4.5)', () => {
        const raw = encodeStateAttributes([VISITS, TOTAL, BUSY]);
        const { rows } = stateAttributeRows(raw);
        expect(rows[1]).toEqual(TOTAL);
        expect(rows[2]).toEqual(BUSY);
        expect(encodeStateAttributes(rows)).toBe(raw);
    });

    it('editing another row does not drop equation: the edit lands, the equations stay (the C1 data loss, measured live)', () => {
        const raw = encodeStateAttributes([VISITS, TOTAL, BUSY]);
        const { rows } = stateAttributeRows(raw);
        const edited = encodeStateAttributes(rows.map((r, i) => (i === 0 ? { ...r, initial: '1' } : r)));
        const back = decodeStateAttributes(edited);
        expect(back.defects).toEqual([]);
        expect(back.decls.map(d => [d.name, d.initial, d.equation])).toEqual([
            ['visits', 1, undefined], ['total', undefined, 'p1.[visits] + p2.[visits]'], ['busy', undefined, 'self.[visits] > 0'],
        ]);
    });
});

describe('R-SIM-88: an input record, neither initial nor equation (P-2026-09-28-0034)', () => {
    const DECISION: StateAttributeRecord = { name: 'decision', metaclass: 'C_Dec', space: 'semantic', domain: { kind: 'boolean' }, initial: '', input: true };

    it('encode: an input record writes `"input":true` last, with no initial and no equation (mutant: the input written as initial)', () => {
        expect(encodeStateAttributes([F, DECISION])).toBe(
            '{"v":1,"attrs":['
            + '{"name":"f","metaclass":null,"space":"semantic","domain":{"kind":"boolean"},"initial":"false"},'
            + '{"name":"decision","metaclass":"C_Dec","space":"semantic","domain":{"kind":"boolean"},"input":true}]}');
    });

    it('decode: an input is a declaration with `input` and no initial (mutant: the input record a defect)', () => {
        const { decls, defects } = decodeStateAttributes(encodeStateAttributes([F, DECISION]));
        expect(defects).toEqual([]);
        expect(decls[1]).toEqual({ name: 'decision', metaclass: 'C_Dec', space: 'semantic', domain: { kind: 'boolean' }, input: true });
        expect(decls[1]).not.toHaveProperty('initial');
        // control: a stored record has no input
        expect(decls[0]).not.toHaveProperty('input');
    });

    it('exclusivity of three: input with initial or equation is `exclusive`; on presentation, or not `true`, a record defect (mutant: exclusivity of two only)', () => {
        const out = decodeStateAttributes(stored([
            { ...F, input: true },
            { name: 'd', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'true', input: true },
            { name: 'p', metaclass: null, space: 'presentation', domain: null, input: true },
            { name: 'q', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: 1 },
            { name: 'ok', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, input: true },
        ]));
        expect(out.decls.map(d => d.name)).toEqual(['ok']);
        expect(out.defects).toEqual([
            { index: 0, name: 'f', code: 'exclusive', message: 'input and initial' },
            { index: 1, name: 'd', code: 'exclusive', message: 'input and equation' },
            { index: 2, name: 'p', code: 'record', message: 'an input is semantic' },
            { index: 3, name: 'q', code: 'record', message: 'bad input' },
        ]);
    });

    it('the rows carry input, and the round trip through them keeps it (mutant: the rows drop input)', () => {
        const raw = encodeStateAttributes([F, DECISION]);
        const { rows } = stateAttributeRows(raw);
        expect(rows[1]).toEqual(DECISION);
        expect(rows[0]).not.toHaveProperty('input');
        expect(encodeStateAttributes(rows)).toBe(raw);
    });
});
