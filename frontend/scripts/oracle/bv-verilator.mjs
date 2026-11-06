#!/usr/bin/env node
/**
 * Bit-vector oracle, step 2 of 2 (R-BV-10): computes `expected` for every row
 * of `src/jjel/__tests__/fixtures/bv-cases.json` with Verilator, not with the
 * evaluator. One SystemVerilog module per operator family, every operand a
 * two-state variable sized and signed explicitly, one `$display` per case
 * printing the case index and the result in hex. Each module is built with
 * `verilator --binary` in `frontend/.vite-cache/bv-oracle/` (gitignored) and
 * run; the output is parsed and written back into the table.
 *
 * A row Verilog cannot express identically is listed with its reason and gets
 * no `expected`; a row with no output line is an error (exit 1).
 *
 * Run: node scripts/oracle/bv-verilator.mjs   (after bv-cases.mjs; npm run oracle:bv runs both)
 */

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = resolve(HERE, '../../src/jjel/__tests__/fixtures/bv-cases.json');
const SCRATCH = resolve(HERE, '../../.vite-cache/bv-oracle');

/** Verilator's widest vector (V3Number); wider rows are not expressible. */
const VERILATOR_MAX_WIDTH = 65536;

/** Operator family -> the operators its module holds. */
const FAMILIES = {
    arith: ['add', 'sub', 'mul', 'neg'],
    cmp: ['eq', 'ne', 'lt', 'le', 'gt', 'ge'],
    bitwise: ['and', 'or', 'xor', 'not'],
    shift: ['shl', 'shr', 'ashr'],
    select: ['slice', 'bit'],
    concat: ['concat', 'replicate'],
    ext: ['zext', 'sext', 'trunc'],
};

/** The Verilog each JjEL operator is checked against; `a`, `b` carry the row's signedness. */
const MAPPING = {
    add: 'a + b', sub: 'a - b', mul: 'a * b', neg: '-a',
    eq: 'a == b', ne: 'a != b', lt: 'a < b', le: 'a <= b', gt: 'a > b', ge: 'a >= b',
    and: 'a & b', or: 'a | b', xor: 'a ^ b', not: '~a',
    shl: "a << 32'dn", shr: "a >> 32'dn",
    ashr: "signed a: a >>> 32'dn; unsigned a: $signed(a) >>> 32'dn (JjEL ashr copies the top bit whatever the signedness; Verilog >>> is arithmetic only on a signed operand, IEEE 1800-2017 11.4.10)",
    slice: 'a[hi:lo]', bit: 'a[i]',
    concat: '{a, b, ...}', replicate: '{n{a}}',
    zext: 'r = a (unsigned a), r = $unsigned(a) (signed a), r of width t (IEEE 1800-2017 11.8.2, 11.7)',
    sext: 'r = a (signed a), r = $signed(a) (unsigned a), r of width t (IEEE 1800-2017 11.8.2, 11.7)',
    trunc: 'r = a, r of width t: the assignment keeps the low bits (IEEE 1800-2017 10.7)',
};

const BINARY = { add: '+', sub: '-', mul: '*', eq: '==', ne: '!=', lt: '<', le: '<=', gt: '>', ge: '>=', and: '&', or: '|', xor: '^' };

// ---------------------------------------------------------------- MODULE TEXT

const lit = (w, s, hex) => `${w}'${s ? 's' : ''}h${hex}`;

/** Reason a row has no identical Verilog form, or null. */
function inexpressible(row) {
    const widths = [row.w, row.rw, ...(row.rest ?? []).map(([w]) => w)];
    if (widths.some(w => w > VERILATOR_MAX_WIDTH)) return `a width above Verilator's ${VERILATOR_MAX_WIDTH}`;
    return null;
}

/** Statements of one case: operand assignments, then the `$display`. */
function caseText(row, decl) {
    const { op, w, s } = row;
    const A = `${s ? 's' : 'u'}a${w}`;
    const B = `${s ? 's' : 'u'}b${w}`;
    decl.add(`bit ${s ? 'signed ' : ''}[${w - 1}:0] ${A};`);
    const lines = [`${A} = ${lit(w, s, row.a)};`];
    const show = expr => lines.push(`$display("%0d %h", ${row.i}, ${expr});`);
    const assign = rhs => {
        decl.add(`bit [${row.rw - 1}:0] r${row.rw};`);
        lines.push(`r${row.rw} = ${rhs};`);
        show(`r${row.rw}`);
    };
    const n = row.args?.[0];

    if (op in BINARY) {
        decl.add(`bit ${s ? 'signed ' : ''}[${w - 1}:0] ${B};`);
        lines.push(`${B} = ${lit(w, s, row.b)};`);
        show(`${A} ${BINARY[op]} ${B}`);
    } else if (op === 'neg') show(`-${A}`);
    else if (op === 'not') show(`~${A}`);
    else if (op === 'shl') show(`${A} << 32'd${n}`);
    else if (op === 'shr') show(`${A} >> 32'd${n}`);
    else if (op === 'ashr') show(`${s ? A : `$signed(${A})`} >>> 32'd${n}`);
    else if (op === 'slice') show(`${A}[${row.args[0]}:${row.args[1]}]`);
    else if (op === 'bit') show(`${A}[${n}]`);
    else if (op === 'concat') {
        const parts = row.rest.map(([rw, hex], k) => {
            const name = `u${'bc'[k]}${rw}`;
            decl.add(`bit [${rw - 1}:0] ${name};`);
            lines.push(`${name} = ${lit(rw, false, hex)};`);
            return name;
        });
        show(`{${[A, ...parts].join(', ')}}`);
    } else if (op === 'replicate') show(`{${n}{${A}}}`);
    else if (op === 'zext') assign(s ? `$unsigned(${A})` : A);
    else if (op === 'sext') assign(s ? A : `$signed(${A})`);
    else if (op === 'trunc') assign(A);
    else throw new Error(`no Verilog form for operator ${op}`);
    return lines.map(l => `    ${l}`).join('\n');
}

function moduleText(name, rows) {
    const decl = new Set();
    const body = rows.map(r => caseText(r, decl)).join('\n');
    return [
        `// Generated by scripts/oracle/bv-verilator.mjs: ${rows.length} cases.`,
        `module ${name};`,
        ...[...decl].map(d => `  ${d}`),
        '  initial begin',
        body,
        '    $finish;',
        '  end',
        'endmodule',
        '',
    ].join('\n');
}

// ---------------------------------------------------------------- RUN

function run(cmd, args, cwd, logPath) {
    return new Promise((done, fail) => {
        const child = spawn(cmd, args, { cwd });
        let out = '';
        child.stdout.on('data', d => { out += d; });
        child.stderr.on('data', d => { out += d; });
        child.on('error', fail);
        child.on('close', code => {
            writeFileSync(logPath, out);
            if (code === 0) done(out);
            else fail(new Error(`${cmd} exited ${code}; log: ${logPath}`));
        });
    });
}

/** Build and run one family; returns index -> hex. */
async function simulate(family, rows) {
    const name = `bv_${family}`;
    const dir = resolve(SCRATCH, family);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${name}.sv`), moduleText(name, rows));
    await run('verilator', [
        '--binary', '--top-module', name, '-Wno-WIDTH', '-j', '0',
        '-CFLAGS', '-O0', '--Mdir', 'obj', '-o', 'sim', `${name}.sv`,
    ], dir, resolve(dir, 'build.log'));
    const out = await run(resolve(dir, 'obj/sim'), [], dir, resolve(dir, 'run.log'));
    const results = new Map();
    for (const line of out.split('\n')) {
        const m = /^(\d+) ([0-9a-fA-F]+)$/.exec(line.trim());
        if (m) results.set(Number(m[1]), m[2].toLowerCase());
    }
    return results;
}

const version = execFileSync('verilator', ['--version'], { encoding: 'utf8' }).trim();
const table = JSON.parse(readFileSync(CASES_PATH, 'utf8'));
const rows = table.rows;

const skipped = [];
const byFamily = Object.entries(FAMILIES).map(([family, ops]) => {
    const mine = rows.filter(r => ops.includes(r.op));
    const ok = [];
    for (const r of mine) {
        const reason = inexpressible(r);
        if (reason) skipped.push({ i: r.i, op: r.op, reason });
        else ok.push(r);
    }
    return [family, ok];
});
const known = new Set(Object.values(FAMILIES).flat());
const orphans = rows.filter(r => !known.has(r.op));
if (orphans.length > 0) throw new Error(`operators with no family: ${[...new Set(orphans.map(r => r.op))].join(', ')}`);

mkdirSync(SCRATCH, { recursive: true });
const outputs = await Promise.all(byFamily.map(([family, list]) => simulate(family, list)));

const missing = [];
byFamily.forEach(([family, list], k) => {
    const results = outputs[k];
    for (const r of list) {
        const hex = results.get(r.i);
        if (hex === undefined) missing.push(`${r.i} (${family}/${r.op})`);
        else r.expected = hex;
    }
    console.log(`bv-verilator: ${family}: ${list.length} cases, ${results.size} results`);
});

for (const r of rows) {
    if (skipped.some(x => x.i === r.i)) delete r.expected;
}

const { rows: _rows, ...head } = table;
head.oracle = {
    tool: version,
    flags: 'verilator --binary -Wno-WIDTH; two-state bit variables, operands assigned then displayed with %h',
    mapping: MAPPING,
    inexpressible: skipped,
};
const top = JSON.stringify(head, null, 2).replace(/\n}$/, '');
writeFileSync(CASES_PATH, `${top},\n  "rows": [\n${rows.map(r => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`);

console.log(`bv-verilator: ${version}; ${rows.length - skipped.length} expected, ${skipped.length} inexpressible`);
for (const x of skipped) console.log(`  inexpressible: row ${x.i} (${x.op}): ${x.reason}`);
if (missing.length > 0) {
    console.error(`bv-verilator: ${missing.length} rows with no output line: ${missing.slice(0, 20).join(', ')}`);
    process.exit(1);
}
