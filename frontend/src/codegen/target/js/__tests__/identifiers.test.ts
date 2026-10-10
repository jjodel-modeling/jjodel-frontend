/**
 * identifiers — the identifier policy of the JavaScript target profile
 * (R-GEN-6, P-2026-10-10-0950).
 *
 * Executes `mangle` and `JsIdentifierTable` (P11). Validity is judged by the
 * JavaScript parser itself (`new Function`), never by a regex of this file.
 * Each test name says which break kills it; the bench is in the commit message.
 */

import { describe, it, expect } from 'vitest';
import { JS_RESERVED_WORDS, JsIdentifierTable, RUNTIME_NAMES, isValidIdentifier, mangle } from '../identifiers';

/**
 * The parser's verdict: `x` can be declared with `let` in strict code where
 * `await` is reserved, as in the ES module a generated program is (a bare
 * `Function` body is a script, where `let await` is legal).
 */
function parses(x: string): boolean {
    try {
        // eslint-disable-next-line no-new-func
        new Function(`'use strict'; return async function () { let ${x} = 1; return ${x}; };`);
        return true;
    } catch {
        return false;
    }
}

/** A seeded generator (mulberry32): a failure reproduces from the seed in its message. */
function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const ALPHABET = ['a', 'b', 'Z', '_', '1', '9', '-', ' ', '.', '$', 'è', 'ß', '中', '#', '/', 'class', 'new', 'state'];

function randomName(r: () => number): string {
    const n = Math.floor(r() * 4);
    let s = '';
    for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(r() * ALPHABET.length)];
    return s;
}

describe('mangle: one valid identifier per model name', () => {
    it('a valid name is kept as it is (mutant: every name suffixed)', () => {
        for (const name of ['Door', 'locked', 'p_1', '_x', 'Transition2']) expect(mangle(name)).toBe(name);
    });

    it('a JavaScript reserved word gains a trailing underscore (mutant: reserved list dropped)', () => {
        for (const word of ['class', 'new', 'delete', 'function', 'enum', 'await', 'yield', 'let', 'static', 'null', 'true']) {
            expect(JS_RESERVED_WORDS.has(word)).toBe(true);
            expect(parses(word)).toBe(false);
            expect(mangle(word)).toBe(`${word}_`);
            expect(parses(mangle(word))).toBe(true);
        }
    });

    it('the names of the printed code\'s calling convention are reserved too: state, event, next', () => {
        for (const word of ['state', 'event', 'next']) {
            expect(RUNTIME_NAMES.has(word)).toBe(true);
            expect(mangle(word)).toBe(`${word}_`);
        }
    });

    it('invalid characters become underscores, accents are dropped (mutant: characters kept)', () => {
        expect(mangle('my-state')).toBe('my_state');
        expect(mangle('a b.c')).toBe('a_b_c');
        expect(mangle('città')).toBe('citta');
        expect(mangle('中')).toBe('_');
        expect(parses(mangle('a-b c/d#e'))).toBe(true);
    });

    it('a leading digit gains a leading underscore (mutant: digit check dropped)', () => {
        expect(parses('1st')).toBe(false);
        expect(mangle('1st')).toBe('_1st');
        expect(mangle('42')).toBe('_42');
    });

    it('`$` never survives: the runtime of the printer owns every `$` name', () => {
        expect(mangle('$add')).toBe('_add');
        expect(mangle('a$b')).toBe('a_b');
    });

    it('the empty name is `_`', () => {
        expect(mangle('')).toBe('_');
    });

    it('isValidIdentifier agrees with the parser on reserved words, digits and characters', () => {
        for (const x of ['a', '_1', 'class', '1a', 'a-b', 'let', 'Door', '$x', 'state']) {
            const expected = parses(x) && !x.includes('$') && !RUNTIME_NAMES.has(x);
            expect(isValidIdentifier(x), x).toBe(expected);
        }
    });
});

describe('JsIdentifierTable: collisions and an invertible table', () => {
    it('two model names that mangle alike get distinct identifiers, both recorded (mutant: the collision not recorded)', () => {
        const t = new JsIdentifierTable();
        const a = t.identifierOf('id-1', 'a-b');
        const b = t.identifierOf('id-2', 'a b');
        const c = t.identifierOf('id-3', 'a_b');
        expect(a).toBe('a_b');
        expect(b).toBe('a_b_2');
        expect(c).toBe('a_b_3');
        expect(t.keyOf(a)).toBe('id-1');
        expect(t.keyOf(b)).toBe('id-2');
        expect(t.keyOf(c)).toBe('id-3');
    });

    it('asking again for a key returns the identifier it already has (mutant: a fresh suffix on every call)', () => {
        const t = new JsIdentifierTable();
        t.identifierOf('id-1', 'x');
        const second = t.identifierOf('id-2', 'x');
        expect(t.identifierOf('id-2', 'x')).toBe(second);
        expect(t.identifierOf('id-2')).toBe(second);
        expect(t.entries()).toHaveLength(2);
    });

    it('a suffix never lands on a name already taken or reserved', () => {
        const t = new JsIdentifierTable(['x_2']);
        expect(t.identifierOf('k1', 'x')).toBe('x');
        expect(t.identifierOf('k2', 'x')).toBe('x_3');
        expect(t.identifierOf('k3', 'x_3')).toBe('x_3_2');
    });

    it('the extra reserved names of the constructor are never handed out', () => {
        const t = new JsIdentifierTable(['initial', 'step', 'observe']);
        expect(t.identifierOf('k', 'step')).toBe('step_');
    });

    it('the entries say which names were mangled', () => {
        const t = new JsIdentifierTable();
        t.identifierOf('k1', 'Door');
        t.identifierOf('k2', 'class');
        expect(t.entries()).toEqual([
            { key: 'k1', name: 'Door', identifier: 'Door', mangled: false },
            { key: 'k2', name: 'class', identifier: 'class_', mangled: true },
        ]);
    });

    it('without a name the key is mangled', () => {
        const t = new JsIdentifierTable();
        expect(t.identifierOf('_abc-1')).toBe('_abc_1');
    });

    for (const seed of [1, 2, 3, 4, 5]) {
        it(`property, seed ${seed}: every generated name parses, and the table is invertible on all of them`, () => {
            const r = rng(seed);
            const t = new JsIdentifierTable();
            const byKey = new Map<string, string>();
            for (let i = 0; i < 300; i++) {
                const key = `k${Math.floor(r() * 200)}`;
                const name = randomName(r);
                const id = t.identifierOf(key, name);
                if (byKey.has(key)) expect(id, `seed ${seed}, key ${key}`).toBe(byKey.get(key));
                byKey.set(key, id);
                expect(parses(id), `seed ${seed}: ${JSON.stringify(name)} -> ${id}`).toBe(true);
                expect(isValidIdentifier(id), `seed ${seed}: ${id}`).toBe(true);
            }
            const ids = [...byKey.values()];
            expect(new Set(ids).size, `seed ${seed}: identifiers are distinct`).toBe(ids.length);
            for (const [key, id] of byKey) expect(t.keyOf(id), `seed ${seed}: ${id}`).toBe(key);
            expect(t.entries().map(e => e.key).sort()).toEqual([...byKey.keys()].sort());
        });
    }
});
