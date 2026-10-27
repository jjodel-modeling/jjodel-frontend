#!/usr/bin/env node
/**
 * Bit-vector oracle, step 1 of 2 (R-BV-10): generates the case table
 * `src/jjel/__tests__/fixtures/bv-cases.json`, inputs only, as hex text.
 * Every operator and method of slice S1, widths WIDTHS, both signednesses,
 * operands from the edge set {0, 1, 2^(w-1)-1, 2^(w-1), 2^w-1} plus seeded
 * random values, shift amounts {0, 1, w-1, w, w+1}. The expected values are
 * written by step 2, `bv-verilator.mjs`, never by the evaluator.
 *
 * Run: node scripts/oracle/bv-cases.mjs   (or npm run oracle:bv for both steps)
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = resolve(HERE, '../../src/jjel/__tests__/fixtures/bv-cases.json');

const WIDTHS = [1, 4, 7, 8, 16, 32, 33, 53, 54, 64, 65, 128];
const SEED = 0x62765f6f7261636cn; // "bv_oracl"

// ---------------------------------------------------------------- PRNG

let state = SEED;
const M64 = (1n << 64n) - 1n;

/** splitmix64: 64 fresh bits per call, deterministic from SEED. */
function next64() {
    state = (state + 0x9e3779b97f4a7c15n) & M64;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & M64;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & M64;
    return z ^ (z >> 31n);
}

/** A uniformly random w-bit pattern. */
function randBits(w) {
    let acc = 0n;
    for (let k = 0; k < w; k += 64) acc = (acc << 64n) | next64();
    return BigInt.asUintN(w, acc);
}

/** A random integer in [lo, hi]. */
function randInt(lo, hi) {
    return lo + Number(next64() % BigInt(hi - lo + 1));
}

// ---------------------------------------------------------------- OPERANDS

/** The edge set, by index: 0, 1, 2^(w-1)-1, 2^(w-1), 2^w-1. */
function edges(w) {
    const W = BigInt(w);
    return [0n, 1n, (1n << (W - 1n)) - 1n, 1n << (W - 1n), (1n << W) - 1n];
}

/** Ordered edge pairs: equality, the signed and unsigned crossings, the wraps. */
const FIXED_PAIRS = [
    [0, 0], [0, 1], [1, 0], [2, 3], [3, 2], [3, 4], [4, 3], [0, 4],
    [4, 0], [4, 4], [2, 1], [3, 3], [4, 1], [2, 2], [1, 4], [3, 1],
];

/** The first nFixed edge pairs and nRandom random pairs, duplicates dropped. */
function pairs(w, nFixed, nRandom) {
    const e = edges(w);
    const out = FIXED_PAIRS.slice(0, nFixed).map(([p, q]) => [e[p], e[q]]);
    for (let k = 0; k < nRandom; k++) out.push([randBits(w), randBits(w)]);
    return dedupe(out, ([x, y]) => `${x}:${y}`);
}

function dedupe(list, key) {
    const seen = new Set();
    return list.filter(item => {
        const k = key(item);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

const hex = v => v.toString(16);

// ---------------------------------------------------------------- TABLE

const rows = [];

/** One row; `rw` is the result width the operator declares (1 for a comparison). */
function add(row) {
    rows.push({ i: rows.length, ...row });
}

const SIGNS = [false, true];

// Arithmetic: +, -, * modulo 2^w.
for (const op of ['add', 'sub', 'mul']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            for (const [a, b] of s ? pairs(w, 6, 2) : pairs(w, 16, 2)) {
                add({ op, w, s, a: hex(a), b: hex(b), rw: w });
            }
        }
    }
}

// Comparisons, following the signedness.
for (const op of ['eq', 'ne', 'lt', 'le', 'gt', 'ge']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            for (const [a, b] of pairs(w, 8, 1)) add({ op, w, s, a: hex(a), b: hex(b), rw: 1 });
        }
    }
}

// Bitwise methods.
for (const op of ['and', 'or', 'xor']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            for (const [a, b] of s ? pairs(w, 2, 2) : pairs(w, 8, 4)) {
                add({ op, w, s, a: hex(a), b: hex(b), rw: w });
            }
        }
    }
}

// Unary: negation and bitwise not, every edge plus two random values.
for (const op of ['neg', 'not']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            const values = dedupe([...edges(w), randBits(w), randBits(w)], String);
            for (const a of values) add({ op, w, s, a: hex(a), rw: w });
        }
    }
}

// Shifts: amounts {0, 1, w-1, w, w+1}; ashr also on a value with the top bit clear.
for (const op of ['shl', 'shr', 'ashr']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            const e = edges(w);
            const values = dedupe(op === 'ashr' ? [e[3], e[2], randBits(w)] : [e[3], randBits(w)], String);
            const amounts = dedupe([0, 1, w - 1, w, w + 1], String);
            for (const a of values) {
                for (const n of amounts) add({ op, w, s, a: hex(a), args: [n], rw: w });
            }
        }
    }
}

// slice(hi, lo) and bit(i).
for (const w of WIDTHS) {
    for (const s of SIGNS) {
        const lo = randInt(0, w - 1);
        const ranges = dedupe([[w - 1, 0], [w - 1, w - 1], [0, 0], [randInt(lo, w - 1), lo]], String);
        for (const a of [randBits(w), edges(w)[3]]) {
            for (const [hi, lo2] of ranges) add({ op: 'slice', w, s, a: hex(a), args: [hi, lo2], rw: hi - lo2 + 1 });
        }
        const positions = dedupe([0, w - 1, randInt(0, w - 1)], String);
        for (const a of [randBits(w), edges(w)[3]]) {
            for (const k of positions) add({ op: 'bit', w, s, a: hex(a), args: [k], rw: 1 });
        }
    }
}

// concat: every pair of widths, then one three-way row per width; replicate n in {1, 2, 3}.
WIDTHS.forEach((w, p) => {
    WIDTHS.forEach((bw, q) => {
        const s = (p + q) % 2 === 1;
        add({ op: 'concat', w, s, a: hex(randBits(w)), rest: [[bw, hex(randBits(bw))]], rw: w + bw });
    });
    const bw = WIDTHS[(p + 3) % WIDTHS.length];
    const cw = WIDTHS[(p + 7) % WIDTHS.length];
    add({
        op: 'concat', w, s: p % 2 === 0, a: hex(randBits(w)),
        rest: [[bw, hex(randBits(bw))], [cw, hex(randBits(cw))]], rw: w + bw + cw,
    });
    for (const s of SIGNS) {
        for (const n of [1, 2, 3]) add({ op: 'replicate', w, s, a: hex(randBits(w)), args: [n], rw: n * w });
    }
});

// Width changes: zext and sext to {w, w+1, 2w}; trunc to {w, w-1, 1}.
for (const op of ['zext', 'sext', 'trunc']) {
    for (const w of WIDTHS) {
        for (const s of SIGNS) {
            const targets = dedupe(op === 'trunc' ? [w, w - 1, 1].filter(t => t >= 1) : [w, w + 1, 2 * w], String);
            for (const a of [edges(w)[3], randBits(w)]) {
                for (const t of targets) add({ op, w, s, a: hex(a), args: [t], rw: t });
            }
        }
    }
}

// ---------------------------------------------------------------- OUTPUT

const header = {
    about: 'Case table of the bit-vector oracle (R-BV-10). Inputs are hex bit patterns of the stated width: a is the receiver (w bits, signed if s), b the second operand of a binary operator (same width and signedness), rest the further operands of concat as [width, hex] (unsigned), args the integer arguments. rw is the result width; expected is the result in hex as Verilator prints it with %h (0 or 1 for a comparison). Generated by scripts/oracle/bv-cases.mjs, expected written by scripts/oracle/bv-verilator.mjs. Regenerate with npm run oracle:bv.',
    seed: `0x${hex(SEED)}`,
    widths: WIDTHS,
};

/**
 * One row per line, so a regeneration diffs row by row.
 * @param {Record<string, unknown>} head
 * @param {object[]} list
 */
function serialize(head, list) {
    const top = JSON.stringify(head, null, 2).replace(/\n}$/, '');
    return `${top},\n  "rows": [\n${list.map(r => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`;
}

writeFileSync(CASES_PATH, serialize(header, rows));
const ops = new Set(rows.map(r => r.op));
console.log(`bv-cases: ${rows.length} rows, ${ops.size} operators -> ${CASES_PATH}`);
