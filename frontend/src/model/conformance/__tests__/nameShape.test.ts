import { describe, it, expect } from 'vitest';
import { checkNameShape, nameShapeMessage } from '../nameShape';

// The rule under test is the one that used to live in the `Naming error view`
// of the seeded `Default Validation` viewpoint (redux/store.tsx, onDataUpdate).
// These cases pin the three verdicts so the re-hosting is not a rewrite.

describe('checkNameShape — well-formed names', () => {
    it.each([
        'alice',
        'Person',
        'A_0',
        'p1',
        '_private',
        '$ref',
        'my name',
        "O'Brien",
        'O’Brien',
        'Città',
        'Ωmega',
    ])('accepts %j', (name) => {
        expect(checkNameShape(name)).toBe('ok');
    });
});

describe('checkNameShape — empty', () => {
    it('reports an empty string', () => {
        expect(checkNameShape('')).toBe('empty');
    });
    it('treats undefined and null as empty rather than throwing', () => {
        expect(checkNameShape(undefined)).toBe('empty');
        expect(checkNameShape(null)).toBe('empty');
    });
});

describe('checkNameShape — bad first character', () => {
    it.each(['1abc', '9', ' leading', '-dash', '.dot'])('rejects %j', (name) => {
        expect(checkNameShape(name)).toBe('bad_first_char');
    });
});

describe('checkNameShape — bad character set', () => {
    it.each(['a-b', 'a.b', 'a@b', 'a/b', 'a+b', 'a(b)'])('rejects %j', (name) => {
        expect(checkNameShape(name)).toBe('bad_charset');
    });
});

describe('checkNameShape — the two failures are distinguishable', () => {
    it('a bad first character is not reported as a bad charset', () => {
        // '1a' fails both regexes; the first-character verdict must win so the
        // message tells the author the actionable thing.
        expect(checkNameShape('1a')).toBe('bad_first_char');
    });
});

describe('nameShapeMessage', () => {
    it('names the element and states the rule', () => {
        expect(nameShapeMessage('empty', 'o1')).toContain('o1');
        expect(nameShapeMessage('empty', 'o1')).toContain('no name');
        expect(nameShapeMessage('bad_first_char', 'x')).toContain('begin with a letter');
        expect(nameShapeMessage('bad_charset', 'x')).toContain('can only contain');
    });
});
