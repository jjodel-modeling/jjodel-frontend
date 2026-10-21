#!/usr/bin/env node
/**
 * Verilog printer oracle (slice S-D0, test (c)): the text the Verilog printer
 * (`src/codegen/target/verilog/printer.ts`) prints is compiled by Verilator and
 * its values compared, with the `expected` of every row of
 * `src/jjel/__tests__/fixtures/bv-cases.json` (test (a)) and with the S1 value
 * of every composed case of `src/codegen/target/verilog/__tests__/composedCases.ts`
 * (test (b)). Every printed expression is assigned to a variable of its own
 * width, the context the printer's text is exact in, then shown with `%h`.
 *
 * A sibling of `bv-verilator.mjs`: the same `run`, build line and output
 * regex, copied because that script runs on import and exports nothing. The
 * printer is TypeScript, loaded through Vite's `ssrLoadModule`. Scratch in
 * `frontend/.vite-cache/bv-printer-oracle/` (gitignored). Reads, never writes,
 * the case table. Exit 1 on a mismatch or a missing line.
 *
 * Run: node scripts/oracle/bv-printer-verilator.mjs   (not in the normal suite)
 */

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, '../..');
const CASES_PATH = resolve(FRONTEND, 'src/jjel/__tests__/fixtures/bv-cases.json');
const SCRATCH = resolve(FRONTEND, '.vite-cache/bv-printer-oracle');

/** Operator family -> the operators its module holds (as in `bv-verilator.mjs`). */
const FAMILIES = {
    arith: ['add', 'sub', 'mul', 'neg'],
    cmp: ['eq', 'ne', 'lt', 'le', 'gt', 'ge'],
    bitwise: ['and', 'or', 'xor', 'not'],
    shift: ['shl', 'shr', 'ashr'],
    select: ['slice', 'bit'],
    concat: ['concat', 'replicate'],
    ext: ['zext', 'sext', 'trunc'],
};

/** The JjEL expression of each operator (as `bitvectorOracle.test.ts` writes it). */
const EXPR = {
    add: () => 'a + b', sub: () => 'a - b', mul: () => 'a * b', neg: () => '-a',
    eq: () => 'a == b', ne: () => 'a != b', lt: () => 'a < b', le: () => 'a <= b', gt: () => 'a > b', ge: () => 'a >= b',
    and: () => 'a.and(b)', or: () => 'a.or(b)', xor: () => 'a.xor(b)', not: () => 'a.not()',
    shl: r => `a.shl(${r.args[0]})`, shr: r => `a.shr(${r.args[0]})`, ashr: r => `a.ashr(${r.args[0]})`,
    slice: r => `a.slice(${r.args[0]}, ${r.args[1]})`, bit: r => `a.bit(${r.args[0]})`,
    concat: r => `a.concat(${r.rest.map((_, k) => 'cd'[k]).join(', ')})`, replicate: r => `a.replicate(${r.args[0]})`,
    zext: r => `a.zext(${r.args[0]})`, sext: r => `a.sext(${r.args[0]})`, trunc: r => `a.trunc(${r.args[0]})`,
};

const lit = (w, s, hex) => `${w}'${s ? 's' : ''}h${hex}`;
const declaration = (name, w, s) => `bit ${s ? 'signed ' : ''}[${w - 1}:0] ${name};`;

// ---------------------------------------------------------------- PRINTER

const server = await createServer({
    configFile: false,
    root: FRONTEND,
    logLevel: 'error',
    appType: 'custom',
    cacheDir: resolve(SCRATCH, 'vite'),
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
});
const { printVerilog } = await server.ssrLoadModule('/src/codegen/target/verilog/printer.ts');
const { parseExpressionStrict } = await server.ssrLoadModule('/src/jjel/parser/index.ts');
const { COMPOSED_CASES } = await server.ssrLoadModule('/src/codegen/target/verilog/__tests__/composedCases.ts');
await server.close();

function parse(source) {
    const r = parseExpressionStrict(source);
    if (!r.expression || r.errors.length > 0) throw new Error(`${source}: ${r.errors.map(e => e.message).join('; ')}`);
    return r.expression;
}

/** Identifiers bound to Verilog variables: name -> {name, width, signed}. */
function names(vars) {
    return {
        leaf: e => (e.type === 'Identifier' && e.name in vars ? vars[e.name] : null),
        memory: () => null,
    };
}

/** Statements of one case: operand assignments, the printed text assigned to a variable of its width, the `$display`. */
function caseText(index, operands, source, decl) {
    const vars = {};
    const lines = [];
    for (const [jjelName, { name, w, s, hex }] of Object.entries(operands)) {
        decl.add(declaration(name, w, s));
        lines.push(`${name} = ${lit(w, s, hex)};`);
        vars[jjelName] = { name, width: w, signed: s };
    }
    const printed = printVerilog(parse(source), names(vars));
    const rw = printed.type.kind === 'word' ? printed.type.width : 1;
    decl.add(declaration(`r${rw}`, rw, false));
    lines.push(`r${rw} = ${printed.text};`);
    lines.push(`$display("%0d %h", ${index}, r${rw});`);
    return lines.map(l => `    ${l}`).join('\n');
}

function rowOperands(r) {
    const operands = { a: { name: `${r.s ? 's' : 'u'}a${r.w}`, w: r.w, s: r.s, hex: r.a } };
    if (r.b !== undefined) operands.b = { name: `${r.s ? 's' : 'u'}b${r.w}`, w: r.w, s: r.s, hex: r.b };
    r.rest?.forEach(([w, hex], k) => { operands['cd'[k]] = { name: `u${'cd'[k]}${w}`, w, s: false, hex }; });
    return operands;
}

function moduleText(name, cases) {
    const decl = new Set();
    const body = cases.map(c => caseText(c.index, c.operands, c.source, decl)).join('\n');
    return [
        `// Generated by scripts/oracle/bv-printer-verilator.mjs: ${cases.length} cases.`,
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

/** Build and run one module; returns index -> hex. */
async function simulate(family, cases) {
    const name = `pr_${family}`;
    const dir = resolve(SCRATCH, family);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${name}.sv`), moduleText(name, cases));
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
const rows = JSON.parse(readFileSync(CASES_PATH, 'utf8')).rows.filter(r => r.expected !== undefined);

const groups = Object.entries(FAMILIES).map(([family, ops]) => [
    family,
    rows.filter(r => ops.includes(r.op)).map(r => ({
        index: r.i, operands: rowOperands(r), source: EXPR[r.op](r), expected: r.expected, label: `row ${r.i} (${r.op})`,
    })),
]);
groups.push(['composed', COMPOSED_CASES.map((c, k) => ({
    index: k,
    operands: Object.fromEntries(Object.entries(c.vars).map(([n, [w, s, hex]]) => [n, { name: `k${k}_${n}`, w, s, hex }])),
    source: c.jjel,
    expected: c.value,
    label: `composed ${k} (${c.name})`,
}))]);

mkdirSync(SCRATCH, { recursive: true });
const outputs = await Promise.all(groups.map(([family, cases]) => simulate(family, cases)));

const wrong = [];
groups.forEach(([family, cases], k) => {
    const results = outputs[k];
    let agree = 0;
    for (const c of cases) {
        const got = results.get(c.index);
        if (got === c.expected) agree++;
        else wrong.push(`${c.label}: ${c.source} -> verilator ${got ?? 'no line'}, expected ${c.expected}`);
    }
    console.log(`bv-printer-verilator: ${family}: ${cases.length} cases, ${agree} agree`);
});

console.log(`bv-printer-verilator: ${version}; ${groups.reduce((n, [, cases]) => n + cases.length, 0)} cases, ${wrong.length} disagree`);
if (wrong.length > 0) {
    for (const w of wrong.slice(0, 20)) console.error(`  ${w}`);
    process.exit(1);
}
