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

    it('unknown fields are ignored: equation (lane C2) and any other; the record decodes (mutant 2)', () => {
        const out = decodeStateAttributes(stored([
            { ...VISITS, equation: 'self.[a] + 1' },
            { ...COLOR, note: 'x', domain: null },
            { ...VISITS, name: 'v2', domain: { kind: 'range', min: 0, max: 3, step: 1 } },
        ]));
        expect(out.defects).toEqual([]);
        expect(out.decls.map(d => d.name)).toEqual(['visits', 'color', 'v2']);
        expect(out.decls[0]).not.toHaveProperty('equation');
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
        const raw = stored([VISITS, { name: 7, space: 'visual', domain: { kind: 'set' }, initial: 0 }, { ...COLOR, equation: 'x' }]);
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
